<?php

namespace Pterodactyl\Tests\Unit\Policies;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subuser;
use Pterodactyl\Tests\TestCase;
use Pterodactyl\Policies\ServerPolicy;

class ServerPolicyTest extends TestCase
{
    private ServerPolicy $policy;

    public function setUp(): void
    {
        parent::setUp();

        $this->policy = new ServerPolicy();
    }

    public function testRootAdminHasAllAccess()
    {
        $user = User::factory()->make(['root_admin' => true, 'id' => 1]);
        $server = Server::factory()->make(['owner_id' => 2]);

        $result = $this->policy->before($user, 'control.start', $server);
        $this->assertTrue($result);
    }

    public function testServerOwnerHasAllAccess()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 1]);
        $server = Server::factory()->make(['owner_id' => 1]);

        $result = $this->policy->before($user, 'control.start', $server);
        $this->assertTrue($result);
    }

    public function testSubuserWithCorrectPermissionHasAccess()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 2]);
        $server = Server::factory()->make(['owner_id' => 1]);

        $subuser = new Subuser([
            'user_id' => 2,
            'permissions' => ['control.start', 'control.stop'],
        ]);

        $server->setRelation('subusers', collect([$subuser]));

        $result = $this->policy->before($user, 'control.start', $server);
        $this->assertTrue($result);
    }

    public function testSubuserWithoutCorrectPermissionIsDenied()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 2]);
        $server = Server::factory()->make(['owner_id' => 1]);

        $subuser = new Subuser([
            'user_id' => 2,
            'permissions' => ['control.stop'],
        ]);
        $server->setRelation('subusers', collect([$subuser]));

        $result = $this->policy->before($user, 'control.start', $server);
        $this->assertFalse($result);
    }

    public function testNonSubuserIsDenied()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 3]);
        $server = Server::factory()->make(['owner_id' => 1]);
        $server->setRelation('subusers', collect([]));

        $result = $this->policy->before($user, 'control.start', $server);
        $this->assertFalse($result);
    }

    public function testEmptyPermissionDeniesAccess()
    {
        $user = User::factory()->make(['root_admin' => false, 'id' => 2]);
        $server = Server::factory()->make(['owner_id' => 1]);

        $subuser = new Subuser([
            'user_id' => 2,
            'permissions' => ['control.start'],
        ]);
        $server->setRelation('subusers', collect([$subuser]));

        $result = $this->policy->before($user, '', $server);
        $this->assertFalse($result);
    }
}
