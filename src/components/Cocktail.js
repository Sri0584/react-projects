import React from "react";
import { memo } from "react";
import { Link } from "react-router-dom";

const Cocktail = memo(({ id, name, image, glass, info, imagePriority }) => {
	return (
		<article className='cocktail'>
			<img
				src={image}
				alt={`${name} cocktail`}
				fetchpriority={imagePriority ? "high" : "auto"}
				loading={imagePriority ? "eager" : "lazy"}
				width={300}
				height={200}
			/>
			<div className='cocktail-footer'>
				<p>{name}</p>
				<p className='cocktail-glass'>
					<span className='drink-data'>Glass: </span>
					{glass}
				</p>
				<p>{info}</p>
				<Link
					to={`/cocktail/${id}`}
					className='btn btn-primary btn-details'
					aria-label={`View details for ${name} cocktail`}
				>
					Details
				</Link>
			</div>
		</article>
	);
});

Cocktail.displayName = "Cocktail";

export default Cocktail;
