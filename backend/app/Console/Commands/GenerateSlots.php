<?php

namespace App\Console\Commands;

use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateSlots extends Command
{
    protected $signature = 'slots:generate {days=30}';
    protected $description = 'Generate booking slots for upcoming days';

    public function handle(SlotService $slotService)
    {
        $days = (int) $this->argument('days');

        $this->info("Generating slots for next {$days} days...");

        $count = $slotService->generateSlots(
            Carbon::today(),
            Carbon::today()->addDays($days)
        );

        $this->info("✅ Generated {$count} new slots!");

        return Command::SUCCESS;
    }
}