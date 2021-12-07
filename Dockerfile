FROM node:16.13

# This dockerfile is run by diploi image builder, it will have 
# this template repository as itse base and the actual project 
# repository will be mounted in the repository folder.

# Update packages
RUN apt-get update && apt-get install -y nano supervisor openssh-server git bash wget curl locales

RUN mkdir /run/sshd /root/.ssh \
  && chmod 0700 /root/.ssh \
  && ssh-keygen -A \
  && sed -i s/^#PasswordAuthentication\ yes/PasswordAuthentication\ no/ /etc/ssh/sshd_config \
  && sed -i s/root:!/"root:*"/g /etc/shadow \
  # Welcome message
  && echo "Welcome to Diploi Next.js project!" > /etc/motd \
  # Go to app folder by default
  && echo "cd /app;" >> /root/.bashrc

# Fix LC_ALL: cannot change locale (en_US.UTF-8) error
RUN echo "LC_ALL=en_US.UTF-8" >> /etc/environment && \
  echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && \
  echo "LANG=en_US.UTF-8" > /etc/locale.conf && \
  locale-gen en_US.UTF-8

# Symlink some files/dirs we want to persist between dev pod reboots (in development mode)
RUN mkdir -p /root-persist \
  && ln -s /root-persist/.bash_history /root/.bash_history \
  && ln -s /root-persist/.gitconfig /root/.gitconfig \
  && ln -s /root-persist/.vscode-server/ /root/.vscode-server

# Install application
WORKDIR /app
COPY repository/. ./
RUN npm install

# Init and run supervisor
COPY runonce.sh /root/runonce.sh
COPY supervisord.conf /etc/supervisord.conf
CMD /usr/bin/supervisord -c /etc/supervisord.conf
