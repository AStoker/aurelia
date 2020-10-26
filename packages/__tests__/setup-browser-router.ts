import { BrowserPlatform } from '@aurelia/platform-browser';
import { $setup } from './setup-shared';

const platform = new BrowserPlatform(window);
$setup(platform);

console.log(`Browser router test context initialized`);

const testContext = require.context('.', true, /router\/[^_][^_].*?\.spec\.js$/i);
testContext.keys().forEach(testContext);
