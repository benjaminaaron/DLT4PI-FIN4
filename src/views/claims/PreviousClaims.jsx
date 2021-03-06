import React, { useState, useEffect, useRef } from 'react';
import { drizzleConnect } from 'drizzle-react';
import Box from '../../components/Box';
import Currency from '../../components/Currency';
import Button from '../../components/Button';
import { Chip, Typography, Divider, Grid, Paper, createMuiTheme } from '@material-ui/core';
import ThemeProvider from '@material-ui/styles/ThemeProvider';
import colors from '../../config/colors-config';
// import DateIcon from '@material-ui/icons/AccessTime';
import ProofIcon from '@material-ui/icons/Fingerprint';
import moment from 'moment';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import history from '../../components/history';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import OutlinedDiv from '../../components/OutlinedDiv';
import { Checkbox, FormControlLabel } from '@material-ui/core';
import Cookies from 'js-cookie';
import { Fin4Colors } from '../../components/utils';

function PreviousClaims(props) {
	const { t } = useTranslation();

	const [filterIconHovered, setFilterIconHovered] = useState(false);
	const [filterSettingsOpen, setFilterSettingsOpen] = useState(false);

	const toggleFilterSettings = () => {
		setFilterSettingsOpen(!filterSettingsOpen);
	};

	const [filterModes, setFilterModes] = useState({
		pending: true,
		isApproved: true,
		gotRejected: true
	});

	const checkedCookie = useRef(false);

	useEffect(() => {
		let cookieEntry = Cookies.get('claims-filter-modes');
		if (cookieEntry && !checkedCookie.current) {
			checkedCookie.current = true;
			setFilterModes(JSON.parse(cookieEntry));
		}
	});

	const buildCheckbox = (attribute, label) => {
		return (
			<FormControlLabel
				control={
					<Checkbox
						checked={filterModes[attribute]}
						onChange={() => {
							let filterModesCopy = Object.assign({}, filterModes);
							setFilterModes({
								...filterModes,
								[attribute]: !filterModes[attribute]
							});
							// state is not immediately updated, need to do it manually in parallel
							filterModesCopy[attribute] = !filterModesCopy[attribute];
							Cookies.set('claims-filter-modes', JSON.stringify(filterModesCopy), { expires: 7 });
						}}
					/>
				}
				label={label}
			/>
		);
	};

	const filterActive = () => {
		return Object.keys(filterModes).filter(key => filterModes[key] === false).length > 0;
	};

	const getFilterIconStyle = () => {
		if (filterIconHovered) {
			return styles.iconHovered;
		}
		if (filterSettingsOpen) {
			return styles.iconActive;
		}
		if (filterActive()) {
			return styles.iconDefaultFiltersActive;
		}
		return styles.iconDefault;
	};

	return (
		<>
			<Box title={t('claims.previous-claims.box-title')}>
				<TableIcons>
					{/* TODO share code with SortableTokenList by outsourcing a SortFilterMenu.jsx */}
					{filterActive() ? (
						<small style={{ fontFamily: 'arial', color: Fin4Colors.darkPink }}>
							{t('claims.previous-claims.filter.filter-active') + ' '}
						</small>
					) : (
						''
					)}
					<FontAwesomeIcon
						icon={faFilter}
						style={getFilterIconStyle()}
						onClick={toggleFilterSettings}
						onMouseEnter={() => setFilterIconHovered(true)}
						onMouseLeave={() => setFilterIconHovered(false)}
					/>
				</TableIcons>
				{filterSettingsOpen && (
					<OutlinedDiv label={t('claims.previous-claims.filter.menu-title')}>
						{buildCheckbox('pending', t('claims.previous-claims.filter.pending-checkbox'))}
						{buildCheckbox('isApproved', t('claims.previous-claims.filter.approved-checkbox'))}
						{buildCheckbox('gotRejected', t('claims.previous-claims.filter.rejected-checkbox'))}
					</OutlinedDiv>
				)}
				{Object.keys(props.fin4Tokens).length > 0 &&
					Object.keys(props.usersClaims).map(pseudoClaimId => {
						let claim = props.usersClaims[pseudoClaimId];
						let status = claim.gotRejected ? 'gotRejected' : claim.isApproved ? 'isApproved' : 'pending';
						if (!filterModes[status]) {
							return;
						}
						let token = props.fin4Tokens[claim.token];
						if (!token) {
							// can happen in some race condition cases
							return;
						}
						let date = moment.unix(claim.claimCreationTime).calendar();
						let symbol = token.symbol; // of token that gets claimed
						let proofSite = '/claim/' + symbol + '/proof/' + claim.claimId;
						return (
							<Claim status={status} key={`${claim.token}${claim.claimId}`}>
								<div>
									<Grid container alignItems="center">
										<Grid item xs>
											<Typography gutterBottom variant="h5">
												{token.name}
											</Typography>
										</Grid>
										<Grid item>
											<Typography gutterBottom variant="h6">
												{claim.quantity} <Currency symbol={token.symbol} />
											</Typography>
										</Grid>
									</Grid>
									{claim.comment && (
										<Typography color="textSecondary" variant="body2">
											{claim.comment}
										</Typography>
									)}
								</div>
								<Divider style={{ margin: '10px 0' }} variant="middle" />
								<ThemeProvider theme={chipTheme}>
									<Chip key="0" color="primary" label={date} style={{ margin: '0 7px 7px 0' }} />
								</ThemeProvider>
								{status === 'gotRejected' && (
									<span
										style={{ fontFamily: 'arial', color: 'gray', fontSize: 'small', marginLeft: '20px' }}
										onClick={() => history.push(proofSite)}>
										{t('claims.previous-claims.rejected-label')}
									</span>
								)}
								{status !== 'gotRejected' && (
									<ThemeProvider theme={buttonTheme}>
										<Button
											icon={ProofIcon}
											onClick={() => history.push(proofSite)}
											color={claim.isApproved ? 'primary' : 'secondary'}
											style={{ margin: '0 7px 7px 0' }}>
											{claim.isApproved
												? t('claims.previous-claims.approved-label')
												: t('claims.previous-claims.submit-proof-button')}
										</Button>
									</ThemeProvider>
								)}
							</Claim>
						);
					})}
			</Box>
		</>
	);
}

const TableIcons = styled.div`
	text-align: right;
	margin-top: -10px;
`;

const styles = {
	iconDefaultFiltersActive: {
		color: Fin4Colors.darkPink,
		width: '12px',
		height: '12px'
	},
	iconDefault: {
		color: 'gray',
		width: '12px',
		height: '12px'
	},
	iconHovered: {
		color: 'silver',
		width: '12px',
		height: '12px'
	},
	iconActive: {
		color: Fin4Colors.blue,
		width: '12px',
		height: '12px'
	}
};

const chipTheme = createMuiTheme({
	palette: {
		primary: {
			main: colors.light,
			contrastText: colors.main
		}
	}
});

const buttonTheme = createMuiTheme({
	palette: {
		primary: {
			main: 'rgba(61, 219, 81, 0.7)',
			contrastText: colors.light
		},
		secondary: {
			main: 'rgba(248, 57, 48, 0.7)',
			contrastText: colors.light
		}
	}
});

const Claim = styled(Paper)`
	&& {
		box-sizing: border-box;
		margin: 15px 0;
		padding: 15px;
		background: ${props => {
			switch (props.status) {
				case 'isApproved':
					return colors.true;
				case 'pending':
					return colors.wrong;
				case 'gotRejected':
					return colors.gotRejected;
			}
		}};
	}
`;

const mapStateToProps = state => {
	return {
		usersClaims: state.fin4Store.usersClaims,
		fin4Tokens: state.fin4Store.fin4Tokens
	};
};

export default drizzleConnect(PreviousClaims, mapStateToProps);
