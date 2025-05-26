pipeline {
  agent any

  environment {
    NPM_USER_BASE64 = credentials('npm-user-base64')
    NODE_OPTIONS = '--openssl-legacy-provider'
  }
  
  stages {
    stage('Checkout') {
      steps {
        git 'https://github.com/ladon-documents/ladon-frontend.git'
      }
    }

    stage('Run release') {
      steps {
        sh 'npm run release'
      }
    }

    stage('Distribute to ladon') {
      steps {
        sh 'npm publish'
      }
    }
  }
  
  post {
    always {
      cleanWs()
    }

    success {
      slackSend(message: "If you can read this, you just dropped a new ladon-frontend 🚀")
    }

  }
}

private Boolean isMasterBranch() {
  return (env.BRANCH_NAME == 'master') ? true : false
}
