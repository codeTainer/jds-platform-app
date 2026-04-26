<?php

namespace App\Support;

use Carbon\CarbonInterface;

class SharePurchaseWindow
{
    public static function forShareMonth(
        CarbonInterface $shareMonth,
        ?CarbonInterface $reference = null,
        ?CarbonInterface $cycleStartsOn = null,
        ?CarbonInterface $cycleEndsOn = null
    ): array
    {
        $normalizedShareMonth = $shareMonth->copy()->startOfMonth();
        $cycleStartMonth = $cycleStartsOn?->copy()->startOfMonth();
        $cycleEndMonth = $cycleEndsOn?->copy()->startOfMonth();
        $isWithinCycle = (! $cycleStartMonth || $normalizedShareMonth->greaterThanOrEqualTo($cycleStartMonth))
            && (! $cycleEndMonth || $normalizedShareMonth->lessThanOrEqualTo($cycleEndMonth));

        if ($cycleStartMonth && $normalizedShareMonth->equalTo($cycleStartMonth)) {
            $opensAt = $normalizedShareMonth->copy()->day(25)->startOfDay();
            $closesAt = $normalizedShareMonth->copy()->addMonthNoOverflow()->day(5)->endOfDay();
        } else {
            $opensAt = $normalizedShareMonth->copy()->subMonthNoOverflow()->day(25)->startOfDay();
            $closesAt = $normalizedShareMonth->copy()->day(5)->endOfDay();
        }

        $referenceTime = $reference?->copy() ?? now();

        return [
            'opens_at' => $opensAt,
            'closes_at' => $closesAt,
            'is_in_cycle' => $isWithinCycle,
            'is_open' => $isWithinCycle && $referenceTime->between($opensAt, $closesAt, true),
        ];
    }

    public static function closedMessage(
        CarbonInterface $shareMonth,
        ?CarbonInterface $reference = null,
        ?CarbonInterface $cycleStartsOn = null,
        ?CarbonInterface $cycleEndsOn = null
    ): string
    {
        $window = self::forShareMonth($shareMonth, $reference, $cycleStartsOn, $cycleEndsOn);

        if (! $window['is_in_cycle']) {
            return sprintf(
                'Share payment for %s is outside the selected cycle.',
                $shareMonth->copy()->startOfMonth()->format('F Y')
            );
        }

        return sprintf(
            'Share payment for %s can only be submitted between %s and %s.',
            $shareMonth->copy()->startOfMonth()->format('F Y'),
            $window['opens_at']->format('F j, Y'),
            $window['closes_at']->format('F j, Y')
        );
    }
}
