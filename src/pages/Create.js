import { useState } from "react";
import { useRef } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { ContractFactory } from "ethers";
import contractAbi from "../contract/abi.json";
import contractByteCode from "../contract/bytecode.json";
import { BYTECODE } from "../contract/bytecode";
import { SOURCE_CODE, SOURCE_CODE_2 } from "../contract/ERC20_flat";
import { Button, Card, CardContent, Grid, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Create() {
  const MAINNET_ID = "0x4e454152";
  const TESTNET_ID = "0x4e454153";
  const MAINNET_BASE_URL = "https://explorer.mainnet.aurora.dev";
  const TESTNET_BASE_URL = "https://explorer.testnet.aurora.dev";

  const CHAIN_ID = TESTNET_ID;
  const BASE_URL = TESTNET_BASE_URL;

  const nameRef = useRef();
  const symbolRef = useRef();
  const decimalsRef = useRef();
  const supplyRef = useRef();
  const ownerRef = useRef();
  const history = useNavigate();


  async function requestAccount() {
    if (window.ethereum.chainId !== CHAIN_ID) {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_ID }]
      });
    }
    
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }


  async function deploy(event) {
    event.preventDefault();

    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      try {
        const factory = new ContractFactory(
          contractAbi,
          contractByteCode,
          signer
        );

        const contract = await factory.deploy(
          nameRef.current.value,
          symbolRef.current.value,
          decimalsRef.current.value,
          supplyRef.current.value,
          ownerRef.current.value ? ownerRef.current.value :
            await signer.getAddress()
        );

        console.log(
          `${BASE_URL}/address/${contract.address}/contracts`
        );
        console.log(contract.deployTransaction);

        verify(contract.address);
      } catch (err) {
        console.log("Error: ", err);
      }
    } else {
      console.log("Metamask not connected.");
    }
  }


  async function verify(contactAddress) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api?module=contract&action=verify`,

        {
          addressHash: "0x31C7844BfEADEcb7E8AF0f506D359a9B95f8De58",
          compilerVersion: "v0.8.7+commit.e28d00a7",
          contractSourceCode: SOURCE_CODE_2,
          name: "ERC20Token",
          optimization: true,
        }
        // {
        //   "addressHash": "0x02c05C06fd0F051c01dA90f63FD247eb47a91987",
        //   "compilerVersion": "v0.8.7+commit.e28d00a7",
        //   "contractSourceCode": SOURCE_CODE_2,
        //   "name": "MyTestToken",
        //   "optimization": true
        // }
      );
      console.log(response);
    } catch (err) {
      console.log("Error: ", err);
    }
  }


  return (
    <div className="create">
      <h1>Create</h1>
      <form onSubmit={deploy}>
        <Grid container spacing={1}>
          <Grid xs={12} md={4} item>
            <label>Name<span> *</span></label>
            <TextField
              inputRef={nameRef}
              placeholder="e.g. Super Cool Token"
              variant="outlined"
              size="small"
              fullWidth
              required
            />
          </Grid>
          <Grid xs={12} md={4} item>
            <label>Symbol<span> *</span></label>
            <TextField
              inputRef={symbolRef}
              placeholder="e.g. SCT"
              variant="outlined"
              size="small"
              fullWidth
              required
            />
          </Grid>
          <Grid xs={12} md={4} item>
            <label>Decimals<span> *</span></label>
            <TextField
              inputRef={decimalsRef}
              type="number"
              placeholder="e.g. 18"
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{ inputProps: { min: 0, max: 18 } }}
              required
            />
          </Grid>
          <Grid xs={12} md={4} item>
            <label>Total supply<span> *</span></label>
            <TextField
              inputRef={supplyRef}
              type="number"
              placeholder="e.g. 1000000000"
              variant="outlined"
              size="small"
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
              required
            />
          </Grid>
          <Grid xs={12} md={8} item>
            <label>Owner address</label>
            <TextField
              inputRef={ownerRef}
              placeholder="e.g. 0xabc123abc123abc123abc123abc123abc123abc1"
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid xs={12} item>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Create
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* <Grid xs={12} md={4} lg={3} item>
        <Button onClick={verify} variant="contained" color="primary" fullWidth>
          Verify
        </Button>
      </Grid> */}
    </div>
  );
}

export default Create;
