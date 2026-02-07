// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
  function transfer(address to, uint256 amount) external returns (bool);
  function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PlasmaEscrow {
  IERC20 public immutable token;          // USDT0 on Plasma
  address public immutable oracleRelayer; // your relayer EOA (the ONLY one allowed to resolve)

  enum State { None, Funded, Released, Refunded }

  struct Deal {
    address buyer;
    address seller;
    uint256 amount;
    State state;
  }

  mapping(bytes32 => Deal) public deals; // dealId -> deal

  constructor(address _token, address _oracleRelayer) {
    token = IERC20(_token);
    oracleRelayer = _oracleRelayer;
  }

  function deposit(bytes32 dealId, address seller, uint256 amount) external {
    Deal storage d = deals[dealId];
    require(d.state == State.None, "deal exists");
    deals[dealId] = Deal(msg.sender, seller, amount, State.Funded);
    require(token.transferFrom(msg.sender, address(this), amount), "transferFrom failed");
  }

  function resolve(bytes32 dealId, bool delivered) external {
    require(msg.sender == oracleRelayer, "only relayer");
    Deal storage d = deals[dealId];
    require(d.state == State.Funded, "not funded");

    d.state = delivered ? State.Released : State.Refunded;
    address to = delivered ? d.seller : d.buyer;
    require(token.transfer(to, d.amount), "transfer failed");
  }
}