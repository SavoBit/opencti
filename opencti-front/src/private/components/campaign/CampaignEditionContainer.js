import React, { Component } from 'react';
import PropTypes from 'prop-types';
import graphql from 'babel-plugin-relay/macro';
import { createFragmentContainer } from 'react-relay';
import {
  compose, insert, find, propEq,
} from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import { Close } from '@material-ui/icons';
import inject18n from '../../../components/i18n';
import { SubscriptionAvatars } from '../../../components/Subscription';
import CampaignEditionOverview from './CampaignEditionOverview';

const styles = theme => ({
  header: {
    backgroundColor: theme.palette.navAlt.backgroundHeader,
    padding: '20px 20px 20px 60px',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 5,
  },
  importButton: {
    position: 'absolute',
    top: 15,
    right: 20,
  },
  container: {
    padding: '10px 20px 20px 20px',
  },
  appBar: {
    width: '100%',
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: theme.palette.navAlt.background,
    color: theme.palette.header.text,
    borderBottom: '1px solid #5c5c5c',
  },
  title: {
    float: 'left',
  },
});

class CampaignEditionContainer extends Component {
  render() {
    const {
      t, classes, handleClose, campaign, me,
    } = this.props;
    const { editContext } = campaign;
    // Add current user to the context if is not available yet.
    const missingMe = find(propEq('name', me.email))(editContext) === undefined;
    const editUsers = missingMe ? insert(0, { name: me.email }, editContext) : editContext;
    return (
      <div>
        <div className={classes.header}>
          <IconButton aria-label='Close' className={classes.closeButton} onClick={handleClose.bind(this)}>
            <Close fontSize='small'/>
          </IconButton>
          <Typography variant='h6' classes={{ root: classes.title }}>
            {t('Update a campaign')}
          </Typography>
          <SubscriptionAvatars users={editUsers}/>
          <div className='clearfix'/>
        </div>
        <div className={classes.container}>
          <CampaignEditionOverview campaign={this.props.campaign} editUsers={editUsers} me={me}/>
        </div>
      </div>
    );
  }
}

CampaignEditionContainer.propTypes = {
  handleClose: PropTypes.func,
  classes: PropTypes.object,
  campaign: PropTypes.object,
  me: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

const CampaignEditionFragment = createFragmentContainer(CampaignEditionContainer, {
  campaign: graphql`
      fragment CampaignEditionContainer_campaign on Campaign {
          id
          ...CampaignEditionOverview_campaign
          editContext {
              name
              focusOn
          }
      }
  `,
  me: graphql`
      fragment CampaignEditionContainer_me on User {
          email
      }
  `,
});

export default compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(CampaignEditionFragment);
