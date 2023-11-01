import {CognitoIdentityProviderClient , SignUpCommand} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({});

export const handler = async(event: {body:string}): Promise<{statusCode: number, body: string}> => {


  const {username ,password , email} = JSON.parse(event.body) as {
    username?: string;
    password?: string;
    email?: string;
  }

  console.log("Event:",event);

if(username === undefined || password === undefined || email === undefined){
  return Promise.resolve({statusCode:400,body: "Missing username, email or password"})
}

const UserPoolClientId = process.env.USER_POOL_CLIENT_ID

await client.send(new SignUpCommand({
  ClientId: UserPoolClientId,   
  Username: username,
  Password: password,
  UserAttributes:[
    {
      Name: 'email',
      Value: email
    }
  ],
  
})
);

  return {
    statusCode: 200,
    body: "User created"
  }
}