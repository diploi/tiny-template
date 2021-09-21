import { shellExec } from './lib/shellExec.mjs';

export const healthcheck = async (namespace) => {
  const healthcheck = { mainColor: ColorCodes.GREY, mainStatus: '', items: [] };

  const helmStatus = JSON.parse((await shellExec(`helm status ${namespace} -o json`)).stdout);

  healthcheck.items.push({
    name: 'Setup',
    color: helmStatusMap[helmStatus.info.status],
    status: setupStatusMap[helmStatusMap[helmStatus.info.status]],
    items: [
      {
        name: 'Helm',
        color: helmStatusMap[helmStatus.info.status],
        status: helmStatus.info.status.charAt(0).toUpperCase() + helmStatus.info.status.slice(1).toLowerCase(),
        message: helmStatus.info.description,
      },
    ],
  });

  if (helmStatus.info.status !== 'deployed') {
    healthcheck.mainColor = healthcheck.items[0].color;
    healthcheck.mainStatus = containersStatusMap[healthcheck.mainColor];
    return healthcheck;
  }

  const certificateStatus = (
    await shellExec(
      `kubectl get certificate -n ${namespace} -o jsonpath="{.items[*].status.conditions[*].reason}|{.items[*].status.conditions[*].message}"`
    )
  ).stdout;
  const certificateStatusParts = certificateStatus.split('|');

  let certificateStatusType = certificateStatusParts[0].split(' ');
  certificateStatusType = certificateStatusType[certificateStatusType.length - 1];

  const certificateStatusMessage = certificateStatusParts[1];

  healthcheck.items[0].items.push({
    name: 'Certificates',
    color: certificateStatusMap[certificateStatusType],
    status: certificateStatusType,
    message: certificateStatusMessage,
  });

  healthcheck.items[0].color = Math.max(...healthcheck.items[0].items.map((item) => item.color));
  healthcheck.items[0].status = setupStatusMap[healthcheck.items[0].color];

  const projectStatus = await getPodStatus(namespace, namespace + '-0');
  const redisStatus = await getPodStatus(namespace, 'redis-0');
  const elasticSearchStatus = await getPodStatus(namespace, 'elastic-search-0');

  healthcheck.items.push({
    name: 'Containers',
    color: '',
    status: '',
    items: [
      {
        ...projectStatus,
        name: 'Project',
      },
      {
        ...redisStatus,
        name: 'Redis',
      },
      {
        ...elasticSearchStatus,
        name: 'Elastic Search',
      },
    ],
  });

  healthcheck.items[1].color = Math.max(...healthcheck.items[1].items.map((item) => item.color));
  healthcheck.items[1].status = containersStatusMap[healthcheck.items[1].color];

  healthcheck.items.push({ name: 'Services', color: '', status: '', items: [] });

  const supervisorStatus = (await shellExec(`kubectl exec ${namespace}-0 -n ${namespace} -- supervisorctl status | awk '{print $1, $2}'`))
    .stdout;

  for (const serviceString of supervisorStatus.split('\n')) {
    const parts = serviceString.split(' ');
    if (parts.length < 2) continue;
    if (parts[0] === 'runonce') continue;

    healthcheck.items[2].items.push({
      name: parts[0],
      color: supervisorStatusMap[parts[1]],
      status: parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase(),
    });
  }

  healthcheck.items[2].color = Math.max(...healthcheck.items[2].items.map((item) => item.color));
  healthcheck.items[2].status = servicesStatusMap[healthcheck.items[2].color];

  healthcheck.mainColor = Math.max(...healthcheck.items.map((item) => item.color));
  healthcheck.mainStatus = containersStatusMap[healthcheck.mainColor];

  return healthcheck;
};

const getPodStatus = async (namespace, pod) => {
  const response = (
    await shellExec(`kubectl get pod ${pod} -n ${namespace} -o jsonpath="{.status.phase}|{.status.containerStatuses[0].state}"`)
  ).stdout;

  const parts = response.split('|');

  return { status: parts[0], color: podStatusMap[parts[0]], message: parts[1] };
};

const ColorCodes = {
  GREEN: 1,
  GREY: 2,
  YELLOW: 3,
  RED: 4,
};

const setupStatusMap = {
  [ColorCodes.GREY]: 'Uninstalled',
  [ColorCodes.GREEN]: 'Done',
  [ColorCodes.YELLOW]: 'Pending',
  [ColorCodes.RED]: 'Failed',
};

const containersStatusMap = {
  [ColorCodes.GREY]: 'Stopped',
  [ColorCodes.GREEN]: 'Running',
  [ColorCodes.YELLOW]: 'Pending',
  [ColorCodes.RED]: 'Failed',
};

const servicesStatusMap = {
  [ColorCodes.GREY]: 'Stopped',
  [ColorCodes.GREEN]: 'Running',
  [ColorCodes.YELLOW]: 'Pending',
  [ColorCodes.RED]: 'Failed',
};

const helmStatusMap = {
  unknown: ColorCodes.RED,
  deployed: ColorCodes.GREEN,
  uninstalled: ColorCodes.GREY,
  superseded: ColorCodes.GREY,
  failed: ColorCodes.RED,
  uninstalling: ColorCodes.YELLOW,
  'pending-install': ColorCodes.YELLOW,
  'pending-upgrade': ColorCodes.YELLOW,
  'pending-rollback': ColorCodes.YELLOW,
};

const certificateStatusMap = {
  Ready: ColorCodes.GREEN,
  RequestChanged: ColorCodes.YELLOW,
  Failed: ColorCodes.RED,
};

const podStatusMap = {
  Pending: ColorCodes.YELLOW,
  Running: ColorCodes.GREEN,
  Succeeded: ColorCodes.GREY,
  Failed: ColorCodes.RED,
  Unknown: ColorCodes.RED,
};

const supervisorStatusMap = {
  RUNNING: ColorCodes.GREEN,
  STARTING: ColorCodes.YELLOW,
  STOPPED: ColorCodes.GREY,
};
