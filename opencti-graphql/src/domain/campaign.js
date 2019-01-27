import { map } from 'ramda';
import uuid from 'uuid/v4';
import {
  deleteByID,
  loadByID,
  notify,
  now,
  paginate,
  prepareDate,
  takeTx
} from '../database/grakn';
import { BUS_TOPICS } from '../config/conf';

export const findAll = args => paginate('match $m isa Campaign', args);

export const findById = campaignId => loadByID(campaignId);

export const addCampaign = async (user, campaign) => {
  const wTx = await takeTx();
  const campaignIterator = await wTx.query(`insert $campaign isa Campaign 
    has type "campaign";
    $campaign has stix_id "campaign--${uuid()}";
    $campaign has stix_label "";
    $campaign has stix_label_lowercase "";
    $campaign has name "${campaign.name}";
    $campaign has description "${campaign.description}";
    $campaign has name_lowercase "${campaign.name.toLowerCase()}";
    $campaign has description_lowercase "${
      campaign.description ? campaign.description.toLowerCase() : ''
    }";
    $campaign has first_seen ${prepareDate(campaign.first_seen)};
    $campaign has last_seen ${prepareDate(campaign.last_seen)};
    $campaign has created ${now()};
    $campaign has modified ${now()};
    $campaign has revoked false;
    $campaign has created_at ${now()};
    $campaign has updated_at ${now()};
  `);
  const createCampaign = await campaignIterator.next();
  const createdCampaignId = await createCampaign.map().get('campaign').id;

  if (campaign.createdByRef) {
    await wTx.query(`match $from id ${createdCampaignId};
         $to id ${campaign.createdByRef};
         insert (so: $from, creator: $to)
         isa created_by_ref;`);
  }

  if (campaign.markingDefinitions) {
    const createMarkingDefinition = markingDefinition =>
      wTx.query(
        `match $from id ${createdCampaignId}; $to id ${markingDefinition}; insert (so: $from, marking: $to) isa object_marking_refs;`
      );
    const markingDefinitionsPromises = map(
      createMarkingDefinition,
      campaign.markingDefinitions
    );
    await Promise.all(markingDefinitionsPromises);
  }

  await wTx.commit();

  return loadByID(createdCampaignId).then(created =>
    notify(BUS_TOPICS.StixDomainEntity.ADDED_TOPIC, created, user)
  );
};

export const campaignDelete = campaignId => deleteByID(campaignId);
