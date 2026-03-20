import React from "react";
import { NavLink } from "react-router-dom";
import logo from "../logo.svg";

const Navbar = () => {
	return (
		<nav className='nav-bar'>
			<div className='nav-center'>
				<NavLink to='/' aria-label='Navigate to home page'>
					<img src={logo} alt='Cocktail App home' className='logo' />
				</NavLink>
				<ul className='nav-links' role='navigation' aria-label='Site pages'>
					<li>
						<NavLink to='/' exact activeClassName='active'>
							Home
						</NavLink>
					</li>
					<li>
						<NavLink to='/about' activeClassName='active'>
							About
						</NavLink>
					</li>
				</ul>
			</div>
		</nav>
	);
};

export default Navbar;
