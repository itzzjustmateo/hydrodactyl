<?php

namespace Pterodactyl\Tests\Unit\Services\Servers;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subuser;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Services\Servers\GetUserPermissionsService;

class GetUserPermissionsServiceTest extends TestCase
{
    private GetUserPermissionsService $service;

    public function setUp(): void
    {
        parent::setUp();

        $this->service = new GetUserPermissionsService();
    }

    public function testRootAdminGetsAllPermissions()
    {
        $user = User::factory()->make(['root_admin' => true, 'id' => 1]);
        $server = Server::factory()->make(['owner_id' => 2]);

        $result = $this->service->handle($server, $user);

        $this->assertContains('*', $result);
        $this->assertContains('admin.websocket.errors', $result);
        $this->assertContains('admin.websocket.install', $result);
        $this->assertContains('admin.websocket.transfer', $result);
    }

    public function testServerOwnerGetsAllPermissions()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 1]);
        $server = Server::factory()->make(['owner_id' => 1]);

        $result = $this->service->handle($server, $user);

        $this->assertSame(['*'], $result);
    }

    public function testAdminAndOwnerReturnsAdminPermissions()
    {
        $user = User::factory()->make(['root_admin' => true, 'id' => 1]);
        $server = Server::factory()->make(['owner_id' => 1]);

        $result = $this->service->handle($server, $user);

        $this->assertContains('*', $result);
        $this->assertContains('admin.websocket.errors', $result);
        $this->assertContains('admin.websocket.install', $result);
        $this->assertContains('admin.websocket.transfer', $result);
    }

    public function testSubuserWithPermissionsReturnsPermissions()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 2]);

        $subuser = new Subuser();
        $subuser->permissions = ['control.start', 'control.stop'];

        $relationMock = \Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $relationMock->shouldReceive('where')->with('user_id', 2)->andReturnSelf();
        $relationMock->shouldReceive('first')->andReturn($subuser);

        $server = \Mockery::mock(Server::class)->makePartial();
        $server->shouldReceive('subusers')->andReturn($relationMock);
        $server->owner_id = 1;

        $result = $this->service->handle($server, $user);

        $this->assertSame(['control.start', 'control.stop'], $result);
    }

    public function testNonSubuserReturnsEmptyArray()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 3]);

        $relationMock = \Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $relationMock->shouldReceive('where')->with('user_id', 3)->andReturnSelf();
        $relationMock->shouldReceive('first')->andReturn(null);

        $server = \Mockery::mock(Server::class)->makePartial();
        $server->shouldReceive('subusers')->andReturn($relationMock);
        $server->owner_id = 1;

        $result = $this->service->handle($server, $user);

        $this->assertSame([], $result);
    }
}
