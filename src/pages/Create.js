import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ethers, ContractFactory } from "ethers";
import { Button, Grid, TextField } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import Tooltip from "@mui/material/Tooltip";
import contractAbi from "../contract/abi.json";
import contractByteCode from "../contract/bytecode.json";
// import { SOURCE_CODE } from "../contract/ERC20_flat";

function Create() {
  /**
   * Constants
   */
  const MAINNET_ID = "0x4e454152";
  const TESTNET_ID = "0x4e454153";
  const MAINNET_BASE_URL = "https://explorer.mainnet.aurora.dev";
  const TESTNET_BASE_URL = "https://explorer.testnet.aurora.dev";
  const CHAIN_ID = MAINNET_ID;
  const BASE_URL = MAINNET_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState();
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
    try {
      if (window.ethereum.chainId !== CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: CHAIN_ID }],
        });
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (err) {
      throw new Error(err.message);
    }
  }

  /**
   * Deploys new contract
   */
  async function deploy(event) {
    event.preventDefault();

    if (typeof window.ethereum !== "undefined") {
      try {
        await requestAccount();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        setLoading(true);

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

        setLoading(false);

        if (contract.address) {
          setAlert({ type: "success", msg: "Your token has been created!" });

          const start = new Date();
          let responseFull = false;
          do {
            const response = await axios.get(
              `${BASE_URL}/api?module=token&action=getToken&contractaddress=${contract.address}`
            );

            if (
              response.data?.result &&
              response.data.result.name &&
              response.data.result.symbol &&
              response.data.result.type &&
              response.data.result.decimals &&
              response.data.result.totalSupply
            ) {
              responseFull = true;
              history("/Interact/" + contract.address);
            }
            await delay(500);
          } while (!responseFull && new Date() - start < 20000);
        } else {
          setAlert({
            type: "error",
            msg: "An error has occurred in the creation of your token.",
          });
        }
      } catch (err) {
        setLoading(false);

        if (err.code === 4001) {
          setAlert({ type: "info", msg: "Operation canceled by user." });
        } else if (err.message) {
          setAlert({ type: "error", msg: err.message });
        } else {
          setAlert({
            type: "error",
            msg: "An error has occurred in the creation of your token.",
          });
        }
      }
    } else {
      setAlert({ type: "error", msg: "Connect to your Metamask extension." });
    }
  }

  /**
   * Verifies contract
   * TODO Currently there seems to be problems with the verification process via API
   */
  // async function verify(contactAddress) {
  //   try {
  //     const response = await axios.post(
  //       `${BASE_URL}/api?module=contract&action=verify`,

  //       {
  //         addressHash: contactAddress,
  //         compilerVersion: "v0.8.7+commit.e28d00a7",
  //         contractSourceCode: SOURCE_CODE,
  //         name: "ERC20Token",
  //         optimization: true,
  //       }
  //     );
  //     console.log(response);
  //   } catch (err) {
  //     console.log("Error: ", err);
  //   }
  // }

  /**
   * Helper delay function
   */
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return (
    <div className="create">
      <h1>Create ERC-20 token</h1>
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
            <label>
              Owner address
              <Tooltip title="If not provided, the current address will be used.">
                <IconButton color="secondary">
                  <InfoRoundedIcon />
                </IconButton>
              </Tooltip>
            </label>
            <TextField
              inputRef={ownerRef}
              placeholder="e.g. 0xabc123abc123abc123abc123abc123abc123abc1"
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid xs={12} item>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              className="submit"
              disabled={loading}
            >
              Create
              {loading && (
                <CircularProgress color="secondary" className="spinner" />
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
      {alert && (
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlert();
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          variant="filled"
          severity={alert.type}
          sx={{ mt: 3 }}
        >
          {alert.msg}
        </Alert>
      )}
    </div>
  );
}

export default Create;
