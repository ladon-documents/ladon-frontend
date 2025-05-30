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
      when {
        expression { env.GIT_TAG_NAME != null) }
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
        if (env.GIT_TAG_NAME != null) {
          slackSend(message: "If you can read this, you just dropped a new ladon-frontend 🚀")
        }
      }
    }

  }
}
