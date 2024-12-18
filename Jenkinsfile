pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "dhishon/curecart:latest"
        SERVER_IP = credentials('server-ip')
        SSH_CREDENTIALS = "ssh-server-credentials"
        GITHUB_CREDENTIALS = "github-credentials"
        DOCKER_HUB_CREDENTIALS = "docker-hub-credentials"
    }

    stages {

        stage('Clone Repository') {
            steps {
                script {
                    echo "Cloning GitHub repository..."
                    git credentialsId: "${GITHUB_CREDENTIALS}", url: 'https://github.com/DhishonThomas/CURE-CART-ECOMMERCE.git', branch: 'main'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image..."
                    sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                script {
                    echo "Logging in to Docker Hub and pushing the Docker image..."
                    withDockerRegistry([credentialsId: "${DOCKER_HUB_CREDENTIALS}", url: '']) {
                        sh "docker push ${DOCKER_IMAGE}"
                    }
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                script {
                    echo "Deploying Docker image to the remote server..."
                    sshPublisher(
                        publishers: [
                            sshPublisherDesc(
                                configName: "${SSH_CREDENTIALS}", // SSH configuration from Jenkins
                                transfers: [
                                    sshTransfer(
                                        execCommand: """
                                            echo "Pulling the latest Docker image..."
                                            docker pull ${DOCKER_IMAGE}

                                            echo "Stopping existing container (if running)..."
                                            docker stop curecart || true

                                            echo "Removing existing container (if exists)..."
                                            docker rm curecart || true

                                            echo "Running the new Docker container..."
                                            docker run -d -p 3000:3000 --name curecart --env-file ./app/CureCart/.env ${DOCKER_IMAGE} || exit 1

                                            echo "Deployment completed successfully."
                                        """
                                    )
                                ]
                            )
                        ]
                    )
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline executed successfully! 🎉"
        }
        failure {
            echo "Pipeline failed. Check the console output for errors. ❌"
        }
    }
}