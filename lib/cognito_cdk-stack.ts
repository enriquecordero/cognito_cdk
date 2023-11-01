import * as cdk from 'aws-cdk-lib';
import { AuthorizationType, CognitoUserPoolsAuthorizer, GatewayResponse, LambdaIntegration, ResponseType, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { AccountRecovery, CfnUserPoolGroup, UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { sign } from 'crypto';
import { join } from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CognitoCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const userPool = new UserPool(this, "myfirstUserPool", {
    

      // Configure sign-in experience , que puedo hacer login con solo el email
      signInAliases: {
        username: true,
      },
      autoVerify: {
        email: true,
      }, 
      accountRecovery: AccountRecovery.EMAIL_ONLY, // User account recovery only Email
      selfSignUpEnabled: true
   });

   const userPoolClient = new UserPoolClient(this, "myAppClient",{
    userPool,
    generateSecret:false,
    authFlows:{
      userPassword: true
    }
   })

   const adminGroup = new CfnUserPoolGroup(this,'adminGroup',{
    userPoolId: userPool.userPoolId,
    groupName: "admin",
   })


   const reportGroup = new CfnUserPoolGroup(this,'reportGroup',{
    userPoolId: userPool.userPoolId,
    groupName: "report",
   })


   const subpoenaGroup = new CfnUserPoolGroup(this,'subpoenaGroup',{
    userPoolId: userPool.userPoolId,
    groupName: "subpoenaGroup",
   })



// SignUP 

    const signUp = new NodejsFunction(this,"signUp",{
      functionName: "signUpFunction",
      entry: "lambda/signUpFunction.ts",
      handler: "handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      environment:{
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
      },
      bundling: {
        minify: true,
        sourceMap:false
      },      
    });

    signUp.addToRolePolicy(new PolicyStatement({
      actions:['cognito-idp:SignUp'],
      resources:[userPool.userPoolArn]
    }))
    // Add to group
    const addgroup = new NodejsFunction(this,"addgroup",{
      functionName: "addGroupFunction",
      entry: "lambda/addGroupFunction.ts",
      handler: "handler",
      memorySize: 128,   
      runtime: Runtime.NODEJS_16_X,
      environment:{
        USER_POOL_ID: userPool.userPoolId
      },
      bundling: {
        minify: true,
        sourceMap:false
      },      
    });

    addgroup.addToRolePolicy(new PolicyStatement({
      actions:['*'],
      resources:["*"]
    }))

    //Confirm 

    const confirm = new NodejsFunction(this,"confirm",{
      functionName: "confirmFunction",
      entry: "lambda/confirmFunction.ts",
      handler: "handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      environment:{
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
      },
      bundling: {
        minify: true,
        sourceMap:false
      },      
    });

    confirm.addToRolePolicy(new PolicyStatement({
      actions:['cognito-idp:ConfirmSignUp'],
      resources:[userPool.userPoolArn]
    }))

    // signIn


    const signIn = new NodejsFunction(this,"signIn",{
      functionName: "signInFunction",
      entry: "lambda/signInFunction.ts",
      handler: "handler",
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      environment:{
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId
      },
      bundling: {
        minify: true,
        sourceMap:false
      },      
    });

    signIn.addToRolePolicy(new PolicyStatement({
      actions:['cognito-idp:InitiateAuth'],
      resources:[userPool.userPoolArn]
    }))


    //API

    const api = new RestApi(this,'cognitoAPi')
    // const gatewayRespone = new GatewayResponse(this,"myGTH",{
    //   restApi: api,
    //    type : ResponseType.UNAUTHORIZED,
    //    responseHeaders: {
    //     'Access-Control-Allow-Origin': "*",
    //     'X-Frame-Options': "DENY", 
    //     'X-Content-Type-Options': "nosniff" 
    //   }      
    // })

    

    api.root.addResource('sign-up').addMethod('POST', new LambdaIntegration(signUp));
    api.root.addResource('sign-in').addMethod('POST', new LambdaIntegration(signIn))
    api.root.addResource('confirm').addMethod('POST', new LambdaIntegration(confirm))
    api.root.addResource('add-group').addMethod('POST', new LambdaIntegration(addgroup))


    const auth = new CognitoUserPoolsAuthorizer(this,'apiAuth',{
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization'
    })


       // signIn
       const secretLambda = new NodejsFunction(this,"secretLambda",{
        functionName: "secretFunction",
        entry: "lambda/secretFunction.ts",
        handler: "handler",
        memorySize: 128,
        timeout: cdk.Duration.seconds(5),
        runtime: Runtime.NODEJS_16_X,         
      });

      api.root.addResource('secret').addMethod('GET', new LambdaIntegration(secretLambda),{
        authorizer: auth,
        authorizationType: AuthorizationType.COGNITO
      });

  






  }
}
