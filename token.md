# Adding a token to your DAO

> Tip: o not use Frame, using the build-in signer will allow you to copy and paste chunks of commands without having to confirm every transaction

## Setting up your environment

```bash
f="--env aragon:rinkeby"
dao=
token=
tokenManager=
```

- A line break after a command for eg. `dao new $f`, this means you must create an environment variable, you should sorts these in the block provided
- Commands without line breaks can be run as pasted into the terminal together and run synchronously
- Add the addresses for you own DAO and paste into your `bash` shell as environment variables

<br>

## Add token and token manager

### Unlimited transferable tokens (like in the Company template)

```bash
dao token new "Token" "TKN" $f

dao install $dao token-manager --app-init none $f

dao token change-controller $token $tokenManager $f
dao acl create $dao $tokenManager MINT_ROLE $me $me $f
dao exec $dao $tokenManager initialize $token true 0 $f

```

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
