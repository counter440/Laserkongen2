The SSH push to GitHub failed with the error: "Load key "/root/.ssh/id_rsa": error in libcrypto".

This indicates an issue with the SSH key format. To fix this:

1. Generate a new SSH key:
   ssh-keygen -t ed25519 -C "your-email@example.com"

2. Add the key to your GitHub account:
   a. Display the public key: cat ~/.ssh/id_ed25519.pub
   b. Copy the output and add it as a new SSH key in GitHub settings

3. Test the connection:
   ssh -T git@github.com

4. Push your changes:
   git push -u origin master

If you continue to have issues, consider using HTTPS instead:
   git remote set-url origin https://github.com/counter440/Laserkongen2.git
   
Then push using your GitHub username and password/token:
   git push -u origin master