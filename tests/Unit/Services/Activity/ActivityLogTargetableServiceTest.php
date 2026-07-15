<?php

namespace Pterodactyl\Tests\Unit\Services\Activity;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Activity\ActivityLogTargetableService;

class ActivityLogTargetableServiceTest extends TestCase
{
    private ActivityLogTargetableService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = new ActivityLogTargetableService();
    }

    public function testActorIsNullByDefault()
    {
        $this->assertNull($this->service->actor());
    }

    public function testSubjectIsNullByDefault()
    {
        $this->assertNull($this->service->subject());
    }

    public function testApiKeyIdIsNullByDefault()
    {
        $this->assertNull($this->service->apiKeyId());
    }

    public function testSetAndGetActor()
    {
        $user = User::factory()->make(['id' => 1]);

        $this->service->setActor($user);

        $this->assertSame($user, $this->service->actor());
    }

    public function testSetAndGetSubject()
    {
        $server = Server::factory()->make(['id' => 42]);

        $this->service->setSubject($server);

        $this->assertSame($server, $this->service->subject());
    }

    public function testSetAndGetApiKeyId()
    {
        $this->service->setApiKeyId(5);

        $this->assertSame(5, $this->service->apiKeyId());
    }

    public function testResetClearsAllValues()
    {
        $this->service->setActor(User::factory()->make(['id' => 1]));
        $this->service->setSubject(Server::factory()->make(['id' => 2]));
        $this->service->setApiKeyId(10);

        $this->service->reset();

        $this->assertNull($this->service->actor());
        $this->assertNull($this->service->subject());
        $this->assertNull($this->service->apiKeyId());
    }
}
