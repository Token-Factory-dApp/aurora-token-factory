import classes from "./Home.module.css";

function Home() {
  return (
    <div className={classes.home}>
      <h1 className={classes.title}>Aurora Token Factory</h1>
      <img
        src="/logo512.png"
        className={classes.logo}
        alt="Aurora Token Factory logo"
      ></img>
      <div className={classes.content}>
        <p>Create your own ERC-20 tokens in the Aurora network very easily.</p>
        <p>
          You can also interact with the smart contact directly from the app.
        </p>
      </div>
    </div>
  );
}

export default Home;
