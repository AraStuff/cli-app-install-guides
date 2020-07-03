# Install Agent


> - A line break after a command for eg. `dao new $f`, this means you must create an environment variable, you can stores these in the block provided
> - Commands without line breaks can be run as pasted into the terminal together and run synchronously

`TRANSFER_ROLE` needs to be created for the Agent app to function properly


<br>

**Envoronment Variables**

```bash
f="--env aragon:rinkeby"
dao=
voting=
agent="NEW_AGENT_ADDRESS"
```

<br>

**Commands**

```bash
dao install $dao agent $f

dao acl create $dao $agent TRANSFER_ROLE $voting $voting $f
```