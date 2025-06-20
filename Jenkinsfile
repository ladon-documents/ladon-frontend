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
          if (gitTag && gitTag ==~ /^v\d+\.\d+\.\d+$/) {
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
      // when {
      //   expression { hasGitTag() }
      // }
      steps {
        dir('release') {
          sh 'npm pack'
          sh 'npm publish'
        }
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
  echo "Git tag: ${env.GIT_TAG_NAME}"
  return (env.GIT_TAG_NAME != 'null') ? true : false
}
