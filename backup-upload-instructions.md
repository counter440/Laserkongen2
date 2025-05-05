# Laserkongen GitHub Upload Instructions

GitHub cannot handle uploading the large files in this project directly. Here are two solutions:

## Option 1: Use Git LFS (Large File Storage)

1. Install Git LFS (https://git-lfs.com/)
2. Configure it for this repo:
   ```
   cd /root/Laserkongen/Laserkongen
   git lfs install
   git lfs track "node_modules/@next/swc-linux-x64-gnu/next-swc.linux-x64-gnu.node"
   git lfs track "node_modules/@next/swc-linux-x64-musl/next-swc.linux-x64-musl.node"
   git add .gitattributes
   git commit -m "Add Git LFS tracking"
   ```
3. Push again

## Option 2: Upload without node_modules (Recommended)

1. Create a new clean repository:
   ```
   mkdir /tmp/laserkongen-clean
   cd /root/Laserkongen/Laserkongen
   git archive master | tar -x -C /tmp/laserkongen-clean
   cd /tmp/laserkongen-clean
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/counter440/Laserkongen2.git
   git push -u origin master
   ```

## Option 3: Use the local backup

A complete local backup exists at:
`/root/Laserkongen/Laserkongen/backup-repo/Laserkongen2.git`

You can clone this backup any time:
```
git clone /root/Laserkongen/Laserkongen/backup-repo/Laserkongen2.git new-laserkongen
```

## Important Notes

- The systemd service is still running independently of GitHub
- All your local changes are saved whether GitHub upload succeeds or not
- To restore node_modules if needed: `npm install`