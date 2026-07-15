<?php

namespace Pterodactyl\Tests\Unit\Models;

use Pterodactyl\Models\Node;
use Pterodactyl\Tests\TestCase;

class NodeTest extends TestCase
{
    public function testIsUnderMaintenanceReturnsTrueWhenMaintenanceMode()
    {
        $node = Node::factory()->make(['maintenance_mode' => true]);
        $this->assertTrue($node->isUnderMaintenance());
    }

    public function testIsUnderMaintenanceReturnsFalseWhenNotInMaintenance()
    {
        $node = Node::factory()->make(['maintenance_mode' => false]);
        $this->assertFalse($node->isUnderMaintenance());
    }
}
