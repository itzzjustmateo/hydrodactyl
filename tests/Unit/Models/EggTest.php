<?php

namespace Pterodactyl\Tests\Unit\Models;

use Pterodactyl\Models\Egg;
use Pterodactyl\Tests\TestCase;

class EggTest extends TestCase
{
    public function testCopyScriptInstallReturnsOwnValueWhenSet()
    {
        $egg = Egg::factory()->make([
            'script_install' => 'own-script.sh',
            'copy_script_from' => null,
        ]);

        $this->assertSame('own-script.sh', $egg->getCopyScriptInstallAttribute());
    }

    public function testCopyScriptInstallReturnsOwnValueWhenNoParent()
    {
        $egg = Egg::factory()->make([
            'script_install' => 'own-script.sh',
            'copy_script_from' => 5,
        ]);

        $this->assertSame('own-script.sh', $egg->getCopyScriptInstallAttribute());
    }

    public function testCopyScriptInstallReturnsParentValueWhenNotSet()
    {
        $parent = Egg::factory()->make(['script_install' => 'parent-script.sh']);

        $egg = Egg::factory()->make([
            'script_install' => null,
            'copy_script_from' => 5,
        ]);
        $egg->setRelation('scriptFrom', $parent);

        $this->assertSame('parent-script.sh', $egg->getCopyScriptInstallAttribute());
    }

    public function testCopyScriptInstallReturnsNullWhenNotSetAndNoParent()
    {
        $egg = Egg::factory()->make([
            'script_install' => null,
            'copy_script_from' => null,
        ]);

        $this->assertNull($egg->getCopyScriptInstallAttribute());
    }

    public function testCopyScriptEntryReturnsOwnValueWhenSet()
    {
        $egg = Egg::factory()->make([
            'script_entry' => 'java',
            'copy_script_from' => null,
        ]);

        $this->assertSame('java', $egg->getCopyScriptEntryAttribute());
    }

    public function testCopyScriptEntryReturnsParentValueWhenNotSet()
    {
        $parent = Egg::factory()->make(['script_entry' => 'bash']);

        $egg = Egg::factory()->make([
            'script_entry' => null,
            'copy_script_from' => 5,
        ]);
        $egg->setRelation('scriptFrom', $parent);

        $this->assertSame('bash', $egg->getCopyScriptEntryAttribute());
    }

    public function testCopyScriptContainerReturnsOwnValueWhenSet()
    {
        $egg = Egg::factory()->make([
            'script_container' => 'alpine:latest',
            'copy_script_from' => null,
        ]);

        $this->assertSame('alpine:latest', $egg->getCopyScriptContainerAttribute());
    }

    public function testCopyScriptContainerReturnsParentValueWhenNotSet()
    {
        $parent = Egg::factory()->make(['script_container' => 'ubuntu:latest']);

        $egg = Egg::factory()->make([
            'script_container' => null,
            'copy_script_from' => 5,
        ]);
        $egg->setRelation('scriptFrom', $parent);

        $this->assertSame('ubuntu:latest', $egg->getCopyScriptContainerAttribute());
    }

    public function testInheritConfigFilesReturnsOwnValueWhenSet()
    {
        $egg = Egg::factory()->make([
            'config_files' => '{"files": {"config.yml": {"parser": "yaml"}}}',
            'config_from' => null,
        ]);

        $this->assertSame('{"files": {"config.yml": {"parser": "yaml"}}}', $egg->getInheritConfigFilesAttribute());
    }

    public function testInheritConfigFilesReturnsParentValueWhenNotSet()
    {
        $parent = Egg::factory()->make(['config_files' => '{"parent-config": true}']);

        $egg = Egg::factory()->make([
            'config_files' => null,
            'config_from' => 5,
        ]);
        $egg->setRelation('configFrom', $parent);

        $this->assertSame('{"parent-config": true}', $egg->getInheritConfigFilesAttribute());
    }

    public function testInheritConfigFilesReturnsNullWhenNotSetAndNoParent()
    {
        $egg = Egg::factory()->make([
            'config_files' => null,
            'config_from' => null,
        ]);

        $this->assertNull($egg->getInheritConfigFilesAttribute());
    }

    public function testInheritConfigStartupReturnsOwnValueWhenSet()
    {
        $egg = Egg::factory()->make([
            'config_startup' => '{"startup-config": true}',
            'config_from' => null,
        ]);

        $this->assertSame('{"startup-config": true}', $egg->getInheritConfigStartupAttribute());
    }

    public function testInheritConfigLogsReturnsParentValueWhenNotSet()
    {
        $parent = Egg::factory()->make(['config_logs' => '{"log-config": true}']);

        $egg = Egg::factory()->make([
            'config_logs' => null,
            'config_from' => 5,
        ]);
        $egg->setRelation('configFrom', $parent);

        $this->assertSame('{"log-config": true}', $egg->getInheritConfigLogsAttribute());
    }

    public function testInheritConfigStopReturnsOwnValueWhenSet()
    {
        $egg = Egg::factory()->make([
            'config_stop' => 'stop\n',
            'config_from' => null,
        ]);

        $this->assertSame('stop\n', $egg->getInheritConfigStopAttribute());
    }

    public function testInheritFeaturesReturnsOwnValueWhenSet()
    {
        $egg = Egg::factory()->make([
            'features' => ['eula'],
            'config_from' => null,
        ]);

        $this->assertSame(['eula'], $egg->getInheritFeaturesAttribute());
    }

    public function testInheritFeaturesReturnsParentValueWhenNotSet()
    {
        $parent = Egg::factory()->make(['features' => ['eula', 'subdomain_minecraft']]);

        $egg = Egg::factory()->make([
            'features' => null,
            'config_from' => 5,
        ]);
        $egg->setRelation('configFrom', $parent);

        $this->assertSame(['eula', 'subdomain_minecraft'], $egg->getInheritFeaturesAttribute());
    }

    public function testInheritFeaturesReturnsNullWhenNotSetAndNoParent()
    {
        $egg = Egg::factory()->make([
            'features' => null,
            'config_from' => null,
        ]);

        $this->assertNull($egg->getInheritFeaturesAttribute());
    }

    public function testInheritFileDenylistReturnsOwnValueWhenNoParent()
    {
        $egg = Egg::factory()->make([
            'file_denylist' => ['*.exe', '*.dll'],
            'config_from' => null,
        ]);

        $this->assertSame(['*.exe', '*.dll'], $egg->getInheritFileDenylistAttribute());
    }

    public function testInheritFileDenylistReturnsParentValueWhenNotSet()
    {
        $parent = Egg::factory()->make(['file_denylist' => ['*.sh']]);

        $egg = Egg::factory()->make([
            'file_denylist' => null,
            'config_from' => 5,
        ]);
        $egg->setRelation('configFrom', $parent);

        $this->assertSame(['*.sh'], $egg->getInheritFileDenylistAttribute());
    }
}
