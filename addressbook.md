# Install Address Book


> - A line break after a command for eg. `dao new $f`, this means you must create an environment variable, you can stores these in the block provided
> - Commands without line breaks can be run as pasted into the terminal together and run synchronously

Token wrapper dose does not require any roles to be set. however, an Aragon app is not considered installed without one. the zero address is used to mock a role


<br>

**Envoronment Variables**

```bash
f="--env aragon:rinkeby"
role=0x0000000000000000000000000000000000000000
dao=
erc20=
tokenWrapper="NEW_TOKENWRAPPER_ADDRESS"
```

<br>

**Commands**

```bash
ao install $dao token-wrapper.hatch.aragonpm.eth --app-init-args $erc20 "TOKEN" "TKN"  $flags

dao acl create $dao $tokenWrapper $role $voting $voting $f
```