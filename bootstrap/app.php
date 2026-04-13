<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Database\QueryException;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'auth.token' => \App\Http\Middleware\AuthenticateApiToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (QueryException $exception, $request) {
            $code = (string) $exception->getCode();
            $message = strtolower($exception->getMessage());
            $isSchemaMismatch = in_array($code, ['42703', '42P01', '42S22', '42S02'], true)
                || str_contains($message, 'undefined column')
                || str_contains($message, 'no such column')
                || str_contains($message, 'relation')
                && str_contains($message, 'does not exist')
                || str_contains($message, 'base table or view not found');

            if (! $isSchemaMismatch) {
                return null;
            }

            $payload = [
                'message' => 'The database schema is behind the current code. Please run `php artisan migrate` and try again.',
                'code' => 'database_schema_outdated',
            ];

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json($payload, Response::HTTP_SERVICE_UNAVAILABLE);
            }

            return response($payload['message'], Response::HTTP_SERVICE_UNAVAILABLE);
        });
    })->create();
