import React from 'react';
import Box from '../../components/Box';
import { drizzleConnect } from 'drizzle-react';
import { useTranslation } from 'react-i18next';
import SortableTokenList from '../../components/SortableTokenList';

function TokenOverview(props) {
	const { t } = useTranslation();

	return (
		<>
			<Box title={t('tokens-list.all-tokens-box-title')}>
				<SortableTokenList
					tokens={Object.keys(props.fin4Tokens).map(addr => props.fin4Tokens[addr])}
					showFilterAndSortOptions={false}
				/>
			</Box>
		</>
	);
}

const mapStateToProps = state => {
	return {
		fin4Tokens: state.fin4Store.fin4Tokens
	};
};

export default drizzleConnect(TokenOverview, mapStateToProps);
