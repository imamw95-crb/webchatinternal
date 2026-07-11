<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastSeen
{
    /**
     * Only persist "last seen" at most once per minute to avoid a DB write
     * on every request (navigation, polling, asset loads, etc.).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            if (! $user->last_seen_at || $user->last_seen_at->diffInSeconds(now()) > 60) {
                DB::table('users')->where('id', $user->id)->update(['last_seen_at' => now()]);
                $user->last_seen_at = now();
            }
        }

        return $next($request);
    }
}
