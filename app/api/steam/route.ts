import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STEAM_BASE = "https://api.steampowered.com";

interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.STEAM_API_KEY;
  if (!key) return NextResponse.json({ error: "Steam API key not configured" }, { status: 503 });

  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "resolve") {
      const vanityurl = req.nextUrl.searchParams.get("vanityurl")?.trim();
      if (!vanityurl) return NextResponse.json({ error: "Missing vanityurl" }, { status: 400 });

      const res = await fetch(
        `${STEAM_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanityurl)}`
      );
      const data = await res.json();
      if (data.response?.success === 1) {
        return NextResponse.json({ steamid: data.response.steamid as string });
      }
      return NextResponse.json({ error: "Vanity URL not found. Check the URL and make sure your Steam profile is public." }, { status: 404 });
    }

    if (action === "library") {
      const steamid = req.nextUrl.searchParams.get("steamid")?.trim();
      if (!steamid) return NextResponse.json({ error: "Missing steamid" }, { status: 400 });

      const res = await fetch(
        `${STEAM_BASE}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamid}&include_appinfo=1&include_played_free_games=1`
      );
      const data = await res.json();

      if (!data.response?.games) {
        return NextResponse.json({ error: "Could not load library. Make sure your Steam profile and game details are set to Public in Steam privacy settings." }, { status: 404 });
      }

      const games = (data.response.games as SteamOwnedGame[])
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .map(g => ({
          steam_app_id: g.appid,
          title: g.name,
          playtime_minutes: g.playtime_forever,
          cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
          header_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
        }));

      return NextResponse.json({ games, total: games.length });
    }

    return NextResponse.json({ error: "Unknown action. Use ?action=resolve or ?action=library" }, { status: 400 });
  } catch (e) {
    console.error("Steam API error:", e);
    return NextResponse.json({ error: "Steam API request failed" }, { status: 500 });
  }
}
