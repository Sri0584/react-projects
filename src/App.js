import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { lazy } from "react";
// import pages
import Home from "./pages/Home";
// import components
import Navbar from "./components/Navbar";
import { Suspense } from "react";
import Loading from "./components/Loading";
const SingleCocktail = lazy(() => import("./pages/SingleCocktail"));
const About = lazy(() => import("./pages/About"));
const Error = lazy(() => import("./pages/Error"));

const ReactRouterSetup = () => {
	return (
		<Router>
			<Navbar />
			<Suspense fallback={<Loading />}>
				<Switch>
					<Route exact path='/'>
						<Home />
					</Route>
					<Route path='/about'>
						<About />
					</Route>
					<Route path='/cocktail/:id'>
						<SingleCocktail />
					</Route>
					<Route path='*'>
						<Error />
					</Route>
				</Switch>
			</Suspense>
		</Router>
	);
};

function App() {
	return (
		<div>
			<ReactRouterSetup />
		</div>
	);
}

export default App;
