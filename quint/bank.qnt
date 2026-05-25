module bank {
    var balances: str -> int

    pure val ADDRESSES = Set("alice", "bob", "charlie")

    action deposit(account, amount) = { balances' = balances.setBy(account, curr = curr ) }
    action withdraw(account, amount) = { balances' = balances.setBy(account, curr = curr - amount) }
    action init() { balances' = ADDRESSES.mapBy(_ => 0) }


}
