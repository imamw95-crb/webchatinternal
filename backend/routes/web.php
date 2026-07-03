<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestChatController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PublicGuestChatController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('chat.main');
    }
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Admin-only API routes
    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/users', [DashboardController::class, 'users'])->name('users');
        Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::get('/conversations', [DashboardController::class, 'conversations'])->name('conversations');
        Route::get('/conversations/{conversation}/peek', [DashboardController::class, 'peekConversation'])->name('conversations.peek');
        Route::get('/stats', [DashboardController::class, 'stats'])->name('stats');
        Route::patch('/users/{user}/toggle-status', [DashboardController::class, 'toggleUserStatus'])->name('users.toggle-status');
        Route::patch('/users/{user}/role', [DashboardController::class, 'updateUserRole'])->name('users.role');
    });

    // Chat routes
    Route::get('/chat/{conversation?}', [ChatController::class, 'main'])->name('chat.main');
    Route::get('/chat/{conversation}/messages', [ChatController::class, 'messages'])->name('chat.messages');
    Route::post('/chat/{conversation}/send', [ChatController::class, 'sendMessage'])->name('chat.send');
    Route::post('/chat/{conversation}/read', [ChatController::class, 'markAsRead'])->name('chat.read');
    Route::post('/chat/create', [ChatController::class, 'createConversation'])->name('chat.create');
    // Route::delete('/chat/{conversation}', [ChatController::class, 'destroy'])->name('chat.destroy'); // Deleted chat disabled
    Route::get('/users', [ChatController::class, 'users'])->name('users.list');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Guest chat routes (for users with role 'guest')
Route::middleware(['auth', 'role:guest'])->prefix('guest')->name('guest.')->group(function () {
    Route::get('/chat', [GuestChatController::class, 'start'])->name('chat.start');
    Route::post('/chat', [GuestChatController::class, 'initiate'])->name('chat.initiate');
});

// Public guest chat (no authentication required)
Route::prefix('guest-chat')->name('public.guest.chat.')->group(function () {
    Route::get('/', [PublicGuestChatController::class, 'create'])->name('create');
    Route::post('/', [PublicGuestChatController::class, 'store'])->name('store');
});

require __DIR__.'/auth.php';
