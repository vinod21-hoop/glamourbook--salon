<?php
// app/Jobs/ProcessNoShow.php

namespace App\Jobs;

use App\Services\QueueService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessNoShow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $queueId;

    public function __construct(int $queueId)
    {
        $this->queueId = $queueId;
    }

    public function handle(QueueService $queueService): void
    {
        $queueService->handleNoShow($this->queueId);
    }
}