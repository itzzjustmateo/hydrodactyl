<?php

namespace Pterodactyl\Tests;

use Carbon\Carbon;
use Carbon\CarbonImmutable;

abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
    private array $savedErrorHandlers = [];
    private array $savedExceptionHandlers = [];

    public function setUp(): void
    {
        $this->savedErrorHandlers     = $this->captureErrorHandlers();
        $this->savedExceptionHandlers = $this->captureExceptionHandlers();

        parent::setUp();

        Carbon::setTestNow(Carbon::now());
        CarbonImmutable::setTestNow(Carbon::now());

        $this->setKnownUuidFactory();
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        while (get_error_handler() !== null) {
            restore_error_handler();
        }

        while (get_exception_handler() !== null) {
            restore_exception_handler();
        }

        foreach ($this->savedErrorHandlers as $handler) {
            set_error_handler($handler);
        }

        foreach ($this->savedExceptionHandlers as $handler) {
            set_exception_handler($handler);
        }

        Carbon::setTestNow();
        CarbonImmutable::setTestNow();
    }

    private function captureErrorHandlers(): array
    {
        $handlers = [];

        while (true) {
            $previousHandler = set_error_handler(static fn () => false);
            restore_error_handler();

            if ($previousHandler === null) {
                break;
            }

            $handlers[] = $previousHandler;

            restore_error_handler();
        }

        return array_reverse($handlers);
    }

    private function captureExceptionHandlers(): array
    {
        $handlers = [];

        while (true) {
            $previousHandler = set_exception_handler(static fn () => null);
            restore_exception_handler();

            if ($previousHandler === null) {
                break;
            }

            $handlers[] = $previousHandler;

            restore_exception_handler();
        }

        return array_reverse($handlers);
    }

    public function setKnownUuidFactory()
    {
        // do nothing
    }
}
