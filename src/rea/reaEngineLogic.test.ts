import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXACT_GRADLE_PROPERTIES,
  REA_MCP_CONFIG_PATH,
  REA_ROOT_PATH,
  buildAndroidStudioProjectFiles,
  createReaMcpConfig,
  getSetupTerminalSequence,
  sanitizeProjectFolderName,
  validateMcpPort,
} from './reaEngineLogic';

test('createReaMcpConfig returns exact stdio MCP specification for /SOURCE_READER/rea/', () => {
  const cfg = createReaMcpConfig();
  assert.equal(cfg.name, 'rea');
  assert.equal(cfg.transport, 'stdio');
  assert.equal(cfg.command, 'npx');
  assert.deepEqual(cfg.args, ['rea-agents@latest', 'run']);
  assert.equal(cfg.workingDir, '/SOURCE_READER/rea/');
  assert.equal(REA_ROOT_PATH, '/SOURCE_READER/rea/');
  assert.equal(REA_MCP_CONFIG_PATH, '/SOURCE_READER/rea/.mcp-config.json');
});

test('EXACT_GRADLE_PROPERTIES matches required low-memory fast-build settings', () => {
  assert.ok(
    EXACT_GRADLE_PROPERTIES.includes(
      'org.gradle.jvmargs=-Xmx192m -XX:MaxMetaspaceSize=96m -XX:+UseSerialGC -XX:ReservedCodeCacheSize=32m -Dfile.encoding=UTF-8'
    )
  );
  assert.ok(EXACT_GRADLE_PROPERTIES.includes('org.gradle.workers.max=1'));
  assert.ok(EXACT_GRADLE_PROPERTIES.includes('org.gradle.parallel=false'));
  assert.ok(EXACT_GRADLE_PROPERTIES.includes('org.gradle.daemon=false'));
  assert.ok(EXACT_GRADLE_PROPERTIES.includes('org.gradle.vfs.watch=false'));
  assert.ok(EXACT_GRADLE_PROPERTIES.includes('org.gradle.caching=true'));
  assert.ok(EXACT_GRADLE_PROPERTIES.includes('kotlin.compiler.execution.strategy=in-process'));
  assert.ok(EXACT_GRADLE_PROPERTIES.includes('kotlin.incremental=true'));
});

test('validateMcpPort validates TCP ports between 1024 and 65535', () => {
  assert.deepEqual(validateMcpPort(7331), { valid: true, port: 7331 });
  assert.deepEqual(validateMcpPort('8080'), { valid: true, port: 8080 });
  assert.equal(validateMcpPort(80).valid, false);
  assert.equal(validateMcpPort(70000).valid, false);
  assert.equal(validateMcpPort('abc').valid, false);
});

test('sanitizeProjectFolderName appends _Copy and strips .apk extension', () => {
  assert.equal(sanitizeProjectFolderName('MyApp.apk'), 'MyApp_Copy');
  assert.equal(sanitizeProjectFolderName('MyApp_Copy'), 'MyApp_Copy');
  assert.equal(sanitizeProjectFolderName('  FinVault Pro.apk '), 'FinVault_Pro_Copy');
});

test('buildAndroidStudioProjectFiles scaffolds full Android project with exact gradle.properties', () => {
  const scaffold = buildAndroidStudioProjectFiles('MyApp', 'com.example.myapp', 'test.apk');
  assert.equal(scaffold.folderName, 'MyApp_Copy');
  assert.equal(scaffold.projectRoot, '/SOURCE_READER/MyApp_Copy');
  assert.equal(
    scaffold.files['/SOURCE_READER/MyApp_Copy/gradle.properties'],
    EXACT_GRADLE_PROPERTIES
  );
  assert.ok(scaffold.files['/SOURCE_READER/MyApp_Copy/app/src/main/AndroidManifest.xml']);
  assert.ok(
    scaffold.files['/SOURCE_READER/MyApp_Copy/app/src/main/java/com/example/myapp/MainActivity.java']
  );
  assert.ok(scaffold.files['/SOURCE_READER/MyApp_Copy/build.gradle']);
  assert.ok(scaffold.files['/SOURCE_READER/MyApp_Copy/settings.gradle']);
});

test('getSetupTerminalSequence covers all 4 setup steps', () => {
  const seq = getSetupTerminalSequence(7331);
  const steps = new Set(seq.map((s) => s.step));
  assert.deepEqual([...steps], [1, 2, 3, 4]);
  assert.equal(seq[seq.length - 1].line, '✅ REA Engine is ready. AI agent can now use it.');
});
