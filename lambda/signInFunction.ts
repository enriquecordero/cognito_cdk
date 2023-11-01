import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (
  event: {body: string}
): Promise<{ statusCode: number; body: string }> => {
  const { username, password } = JSON.parse(event.body) as {
    username?: string;
    password?: string;
  };

  if (username === undefined || password === undefined) {
    return Promise.resolve({
      statusCode: 400,
      body: "Missing username or code",
    });
  }

  const UserPoolClientId = process.env.USER_POOL_CLIENT_ID;

  const result = await client.send(
    new InitiateAuthCommand({
      AuthFlow:'USER_PASSWORD_AUTH',
      ClientId: UserPoolClientId,
      AuthParameters:{
      USERNAME: username,
      PASSWORD: password
      }
    })
  );
  const idtoken = result.AuthenticationResult?.IdToken

  if(idtoken === undefined) {
  return Promise.resolve({ statusCode:401,body: 'Auth'})
  }
  return {
    statusCode: 200,
    body: idtoken,
  };
};
