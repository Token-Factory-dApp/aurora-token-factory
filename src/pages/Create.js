import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ethers, ContractFactory } from "ethers";
import { Button, Grid, TextField } from "@mui/material";
import contractAbi from "../contract/abi.json";
import contractByteCode from "../contract/bytecode.json";
import { SOURCE_CODE } from "../contract/ERC20_flat";

function Create() {
  /**
   * Constants
   */
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

  /**
   * Requests for Metamask account
   */
  async function requestAccount() {
    if (window.ethereum.chainId !== CHAIN_ID) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID }],
      });
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  /**
   * Deploys new contract
   */
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
          ownerRef.current.value
            ? ownerRef.current.value
            : await signer.getAddress()
        );

        // TODO remove
        console.log(`${BASE_URL}/address/${contract.address}/contracts`);
        console.log(contract.deployTransaction);

        if (contract.address) {
          history("/Interact/" + contract.address);
        }

      } catch (err) {
        console.log("Error: ", err);
      }
    } else {
      console.log("Metamask not connected.");
    }
  }

  /**
   * Verifies contract
   * TODO Currently there seems to be problems with the verification process via API
   */
  async function verify(contactAddress) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api?module=contract&action=verify`,

        {
          addressHash: contactAddress,
          compilerVersion: "v0.8.7+commit.e28d00a7",
          contractSourceCode: SOURCE_CODE,
          name: "ERC20Token",
          optimization: true,
        }
      );
      console.log(response);
    } catch (err) {
      console.log("Error: ", err);
    }
  }

  return (
    <div className="create">
      <h1>Create ERC20 token</h1>
      <form onSubmit={deploy}>
        <Grid container spacing={1}>
          <Grid xs={12} md={4} item>
            <label>
              Name<span> *</span>
            </label>
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
            <label>
              Symbol<span> *</span>
            </label>
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
            <label>
              Decimals<span> *</span>
            </label>
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
            <label>
              Total supply<span> *</span>
            </label>
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
    </div>
  );
}

export default Create;
