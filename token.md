# Adding a token to your DAO

## Tips

> Do not use Frame, using the build-in signer will allow you to copy and paste chunks of commands without having to confirm every transaction

> If you run a command and the CLI gives you an unhelpful error such as "Cannot find transaction path for executing action" - just try again! Often the CLI will produce inconsistent outputs from the same inputs. Try running it again. Try running another CLI command, then running the original command again. Try waiting 5min and then running the same command again. If it *still* doesn't work, then the command might be incorrect, but it might not!

## Setting up your environment

```bash
f="--env aragon:rinkeby"
dao=YOUR-DAO-ADDRESS
```

- Go into the `Organization` tab on the Aragon client (web app/interface) to see your organization's address.

<br>

## Add token and token manager

### Unlimited transferable tokens (like in the Company template)

```bash
dao token new "Token" "TKN" $f
dao install $dao token-manager --app-init none $f
```

Create a new token and add a new token manager to the DAO.

You'll have to vote (easiest via the client) to approve the installation of the new toke manager.

```bash
token=NEW-TOKEN-ADDRESS
tokenManger=NEW-TOKENMANGER-ADDRESS
dao token change-controller $token $tokenManager $f
dao acl create $dao $tokenManager MINT_ROLE $me $me $f
dao exec $dao $tokenManager initialize $token true 0 $f
```

The new token address will be displayed in the CLI, but the new token manager address will likely be in the vote to add the new token manager to the DAO.

### One Token per account, non-transferable (like in the Membership template)

```bash
dao token new "Token" "TKN" 0 $f
dao install $dao token-manager --app-init none $f

dao token change-controller $token $tokenManager $f
dao acl create $dao $tokenManager MINT_ROLE $voting $voting $f
dao exec $dao $tokenManager initialize $token false 1 $f
```

<br>

## Getting help

If you get stuck or need help please reach out to the [Aragon support channel on Discord](https://discord.gg/NT5fNRp). 
