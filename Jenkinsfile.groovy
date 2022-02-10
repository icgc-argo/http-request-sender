/*
 * Copyright (c) 2020 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

def commit = "UNKNOWN"
def version = "UNKNOWN"
def serviceName = "http-request-sender"
def dockerRepo = "icgcargo/${serviceName}"
def repoName = "icgc-argo"

pipeline {
  agent {
    kubernetes {
      label 'ci-executor'
      yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:12.6.0
    tty: true
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375
  - name: docker
    image: docker:18-git
    tty: true
    env:
    - name: DOCKER_HOST
      value: tcp://localhost:2375
    - name: HOME
      value: /home/jenkins/agent
  - name: dind-daemon
    image: docker:18.06-dind
    securityContext:
      privileged: true
      runAsUser: 0
    volumeMounts:
    - name: docker-graph-storage
      mountPath: /var/lib/docker
  securityContext:
    runAsUser: 1000
  volumes:
  - name: docker-graph-storage
    emptyDir: {}
"""
    }
  }

  stages {

    stage('Checkout Code') {
      steps {
          script {
              commit = sh(returnStdout: true, script: 'git describe --always').trim()
          }
          script {
              version = sh(returnStdout: true, script: 'cat package.json | grep version | cut -d \':\' -f2 | sed -e \'s/"//\' -e \'s/",//\'').trim()
          }
      }
    }

    stage('Build Docker') {
      when {
        branch "master"
      }
      steps {
        container('docker') {
          withCredentials([usernamePassword(credentialsId: 'argoGithub', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
            sh "git tag ${version}"
            sh "git push https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/${repoName}/${serviceName} --tags"
          }
          withCredentials([usernamePassword(credentialsId:'argoDockerHub', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
            sh 'docker login -u $USERNAME -p $PASSWORD'
          }
          sh "docker  build --build-arg COMMIT_ID=${commit} --build-arg VERSION=${version} --network=host -f Dockerfile . -t ${dockerRepo}:latest -t ${dockerRepo}:${version}"
          sh "docker push ${dockerRepo}:${version}"
          sh "docker push ${dockerRepo}:latest"
        }
      }
    }
  }
}