# iOS Unsigned Build Guide

This workflow builds an unsigned IPA that you can sign later.

## How It Works

1. Push code to main/master branch
2. GitHub Actions builds the Flutter iOS app on macOS
3. Creates an unsigned IPA file
4. You download and sign it yourself

## Trigger Build

**Option 1: Push to repo**
```bash
git add .
git commit -m "Build iOS"
git push
```

**Option 2: Manual trigger**
1. Go to https://github.com/Moustapha4951/jeeny/actions
2. Click "iOS Build (Unsigned)"
3. Click "Run workflow"

## Download Build

1. Go to Actions tab in your repo
2. Click on the completed workflow run
3. Scroll to "Artifacts"
4. Download `jeeny-ios-unsigned` (contains the IPA)

## Sign & Install Options

### Option 1: AltStore (Free - Recommended)
1. Install AltStore on your PC: https://altstore.io
2. Connect iPhone to PC via USB
3. Open AltStore on PC
4. Drag the unsigned IPA to AltStore
5. Sign in with your Apple ID (free account works)
6. App installs on your iPhone
7. **Note**: Re-sign every 7 days with free Apple ID

### Option 2: Sideloadly (Free)
1. Download: https://sideloadly.io
2. Connect iPhone via USB
3. Drag IPA into Sideloadly
4. Enter your Apple ID
5. Click Start
6. Trust the app in iPhone Settings → General → Device Management

### Option 3: 3uTools (Free)
1. Download: https://www.3u.com
2. Connect iPhone
3. Go to Apps → Import & Install
4. Select the IPA file

### Option 4: Cydia Impactor
1. Download Cydia Impactor
2. Connect iPhone
3. Drag IPA onto Impactor
4. Enter Apple ID credentials

## After Installation

On your iPhone:
1. Go to Settings → General → VPN & Device Management
2. Find your Apple ID / developer profile
3. Tap "Trust"
4. Now you can open the app

## Troubleshooting

### Build fails with CocoaPods error
- Check that `ios/Podfile` exists
- Ensure Flutter dependencies are correct

### IPA won't install
- Make sure iPhone is connected properly
- Try a different signing tool
- Check iOS version compatibility

### App crashes on launch
- This is likely a code issue, not signing
- Check the app logs

## Free Apple ID Limitations

With a free Apple ID:
- Apps expire after 7 days (re-sign to continue)
- Max 3 apps at a time
- Some capabilities disabled (Push notifications, etc.)

For unlimited signing, get Apple Developer account ($99/year)
