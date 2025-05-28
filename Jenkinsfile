pipeline {
  agent any

  environment {
    NPM_USER_BASE64 = credentials('npm-user-base64')
    NODE_OPTIONS = '--openssl-legacy-provider'
  }

  tools { nodejs "nodejs" }
  
  stages {
    stage('Retrieve git tag') {
      steps {
        script {
          def gitTag = sh(script: 'git describe --tags --exact-match || echo ""', returnStdout: true).trim()
          if (gitTag) {
            env.GIT_TAG_NAME = gitTag
          } else {
            env.GIT_TAG_NAME = null
          }
        }
      }
    }

    stage('Run release') {
      steps {
        sh 'npm run release'
      }
    }


    stage('Distribute to ladon') {
      when {
        expression { hasGitTag() }
      }
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
      script {
        if (hasGitTag()) {
          slackSend(message: "If you can read this, you just dropped a new ladon-frontend 🚀")
        }
      }
    }

  }
}

private Boolean hasGitTag() {
  return (env.GIT_TAG_NAME != null) ? true : false
}

private Boolean isMasterBranch() {
  return (env.BRANCH_NAME == 'master') ? true : false
}
