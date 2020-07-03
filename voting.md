# Install Voting


> - A line break after a command for eg. `dao new $f`, this means you must create an environment variable, you can stores these in the block provided
> - Commands without line breaks can be run as pasted into the terminal together and run synchronously

Three permissions need to be created for the voting app to function properly

* `CREATE_VOTES_ROLE`
* `MODIFY_SUPPORT_ROLE`
* `MODIFY_QUORUM_ROLE`

`quorum` and `support` are both set as base18. vote duration is set in seconds
- 50%   : `500000000000000000`
- 25%   : `250000000000000000`
- 1 day : `86400`

<br>

**Envoronment Variables**

```bash
f="--env aragon:rinkeby"
dao=
token=
tokenManager=
voting="NEW_VOTING_ADDRESS"
```

<br>

**Commands**

```bash
dao install $dao voting --app-init-args $token 500000000000000000 250000000000000000 86400 $f

dao acl create $dao $voting CREATE_VOTES_ROLE $tokenManager $voting $f
dao acl create $dao $voting MODIFY_SUPPORT_ROLE $voting $voting $f
dao acl create $dao $voting MODIFY_QUORUM_ROLE $voting $voting $f
```