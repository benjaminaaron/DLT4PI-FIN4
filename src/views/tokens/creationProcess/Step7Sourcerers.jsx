import React, { useState, useRef, useEffect } from 'react';
import { drizzleConnect } from 'drizzle-react';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import StepsBottomNav from './StepsBottomNav';
import { Checkbox, FormControlLabel, TextField } from '@material-ui/core';
import Dropdown from '../../../components/Dropdown';
import Button from '../../../components/Button';
import { faMinusCircle, faAsterisk } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import update from 'react-addons-update';

function StepSourcerers(props) {
	const { t } = useTranslation();

	const [draftId, setDraftId] = useState(null);
	const [sourcererPairs, setSourcererPairs] = useState({}); // name and pairs[]

	const [mode, setMode] = useState('allCollapsed'); // addExisting, addNew

	useEffect(() => {
		if (!props.draft || draftId) {
			return;
		}
		let draft = props.draft;
		// setUnderlyings(draft.underlyings);
		setDraftId(draft.id);
	});

	const submit = () => {
		props.dispatch({
			type: 'UPDATE_TOKEN_CREATION_DRAFT_FIELDS',
			draftId: draftId,
			lastModified: moment().valueOf(),
			nodeName: 'sourcererPairs',
			node: sourcererPairs
		});
		props.handleNext();
	};

	const updateDraftVal = (key, val) => {
		if (key === 'name') {
			setNewUnderlyingDraft({
				...newUnderlyingDraft,
				name: val
			});
		} else {
			setNewUnderlyingDraft({
				...newUnderlyingDraft,
				[key]: val
			});
		}
	};

	const updateUnderlyingParamVal = (name, paramName, val) => {
		setUnderlyings(
			update(underlyings, {
				[name]: {
					parameters: {
						[paramName]: { $set: val }
					}
				}
			})
		);
	};

	const removeUnderlying = name => {
		setUnderlyings(Object.keys(underlyings).filter(n => name !== name));
	};

	return (
		<>
			{Object.keys(underlyings).length > 0 && Object.keys(props.allUnderlyings).length > 0 && (
				<div style={{ fontFamily: 'arial' }}>
					{Object.keys(underlyings).map((name, index) => {
						let underlyingObj = props.allUnderlyings[name];
						if (!props.allUnderlyings[name]) {
							return;
						}
						return (
							<div key={'underlying_' + index} style={{ paddingTop: '20px' }}>
								<div
									key={'underlyingLabel_' + index}
									title={underlyingObj.contractAddress}
									style={{ display: 'flex', alignItems: 'center' }}>
									<ArrowRightIcon />
									{underlyingObj.name}
									<FontAwesomeIcon
										icon={faMinusCircle}
										style={styles.removeIcon}
										title="Remove underlying"
										onClick={() => removeUnderlying(name)}
									/>
									{underlyingObj.hasOwnProperty('addToFin4') && (
										<FontAwesomeIcon
											icon={faAsterisk}
											style={styles.newIcon}
											title="Will be created new during token creation"
										/>
									)}
								</div>
								{underlyingObj.paramsEncoded &&
									underlyingObj.paramsEncoded.split(',').map((paramStr, paramIndex) => {
										let type = paramStr.split(':')[0];
										let paramName = paramStr.split(':')[1];
										let description = paramStr.split(':')[2];
										let key = 'underlying_' + index + '_param_' + paramIndex;
										return (
											<span key={key}>
												<TextField
													type={type === 'uint' ? 'number' : 'text'}
													label={
														<>
															<span>{paramName}</span>
															{description && <span style={{ fontSize: 'x-small' }}> ({description})</span>}{' '}
														</>
													}
													defaultValue={underlyings[name].parameters[paramName]}
													onChange={e => updateUnderlyingParamVal(name, paramName, e.target.value)}
													style={styles.normalField}
												/>
											</span>
										);
									})}
							</div>
						);
					})}
				</div>
			)}
			{Object.keys(underlyings).length > 0 && <Spacer />}
			<>
				{mode === 'allCollapsed' && (
					<>
						<Button onClick={() => setMode('addExisting')} center="true" color="inherit">
							Add existing underlying
						</Button>
						<div style={{ marginBottom: '30px' }}></div>
						<Button
							center="true"
							color="inherit"
							onClick={() => {
								setMode('addNew');
								setNewUnderlyingDraft({
									name: '',
									contractAddress: '',
									addToFin4: true
								});
							}}>
							Add new underlying
						</Button>
					</>
				)}
				{mode === 'addExisting' && (
					<Dropdown
						onChange={e => {
							let name = e.value;
							let parameters = {};
							let underlyingObj = props.allUnderlyings[name];
							if (underlyingObj.paramsEncoded) {
								underlyingObj.paramsEncoded.split(',').map(paramStr => {
									let paramName = paramStr.split(':')[1];
									parameters[paramName] = null;
								});
							}
							setUnderlyings({
								...underlyings,
								[name]: {
									parameters: parameters
								}
							});
							setMode('allCollapsed');
						}}
						options={Object.keys(props.allUnderlyings)
							.filter(name => Object.keys(underlyings).filter(n => n === name).length === 0)
							.map(name => {
								return {
									value: name,
									label: name
								};
							})}
						label="Choose existing underlying"
					/>
				)}
				{mode === 'addNew' && (
					<>
						<TextField
							key="name-field"
							type="text"
							label="Name"
							value={newUnderlyingDraft.name}
							onChange={e => updateDraftVal('name', e.target.value)}
							style={inputFieldStyle}
						/>
						<TextField
							key="contract-address-field"
							type="text"
							label="Contract address (optional)"
							value={newUnderlyingDraft.contractAddress}
							onChange={e => updateDraftVal('contractAddress', e.target.value)}
							style={inputFieldStyle}
						/>
						<FormControlLabel
							control={
								<Checkbox
									checked={newUnderlyingDraft.addToFin4}
									onChange={() => updateDraftVal('addToFin4', !newUnderlyingDraft.addToFin4)}
								/>
							}
							label="Other token creators can add this too"
						/>
						<center style={{ marginTop: '10px' }}>
							<Button
								color="inherit"
								onClick={() => {
									// adding them here already to avoid having to reload for the
									// newly added ones to become available
									props.dispatch({
										type: 'ADD_UNDERLYING',
										underlying: newUnderlyingDraft
									});
									setUnderlyings({
										...underlyings,
										[newUnderlyingDraft.name]: newUnderlyingDraft
									});
									setMode('allCollapsed');
								}}>
								Add
							</Button>
							<span style={{ marginRight: '20px' }}></span>
							<Button onClick={() => setMode('allCollapsed')} color="inherit">
								Cancel
							</Button>
						</center>
						<br />
					</>
				)}
			</>

			<StepsBottomNav nav={props.nav} handleNext={submit} />
		</>
	);
}

const Spacer = styled.div`
	height: 30px;
`;

const styles = {
	removeIcon: {
		color: 'lightsalmon',
		width: '14px',
		height: '14px',
		paddingLeft: '7px'
	},
	newIcon: {
		color: 'orange',
		width: '14px',
		height: '14px',
		paddingLeft: '7px'
	},
	normalField: {
		width: '80%',
		margin: '8px 0 8px 25px'
	}
};

const inputFieldStyle = {
	width: '100%',
	marginBottom: '15px'
};

const mapStateToProps = state => {
	return {
		allUnderlyings: state.fin4Store.allUnderlyings
	};
};

export default drizzleConnect(StepSourcerers, mapStateToProps);