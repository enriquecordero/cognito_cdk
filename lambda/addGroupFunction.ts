import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: {body: string}): Promise<{ statusCode: number; body: string }> => {

  const { username, groupname } = JSON.parse(event.body) as {
    username?: string;
    groupname?: string;
  };

  if (username === undefined || groupname === undefined) {
    return Promise.resolve({
      statusCode: 400,
      body: "Missing username or groupname",
    });
  }

  const UserPoolId = process.env.USER_POOL_ID;

  const result = await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: UserPoolId,
      Username: username,
      GroupName: groupname,      
    })
  );



  return {
    statusCode: 200,
    body: "User was added",
  };
};
