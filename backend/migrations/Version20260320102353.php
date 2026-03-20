<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260320102353 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE user_user (user_source INT NOT NULL, user_target INT NOT NULL, INDEX IDX_F7129A803AD8644E (user_source), INDEX IDX_F7129A80233D34C1 (user_target), PRIMARY KEY (user_source, user_target)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE user_tweet (user_id INT NOT NULL, tweet_id INT NOT NULL, INDEX IDX_DFA4F163A76ED395 (user_id), INDEX IDX_DFA4F1631041E39B (tweet_id), PRIMARY KEY (user_id, tweet_id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE user_user ADD CONSTRAINT FK_F7129A803AD8644E FOREIGN KEY (user_source) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_user ADD CONSTRAINT FK_F7129A80233D34C1 FOREIGN KEY (user_target) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_tweet ADD CONSTRAINT FK_DFA4F163A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE user_tweet ADD CONSTRAINT FK_DFA4F1631041E39B FOREIGN KEY (tweet_id) REFERENCES tweet (id) ON DELETE CASCADE');

        // Migrate existing follow relations to many-to-many join table.
        $this->addSql('INSERT IGNORE INTO user_user (user_source, user_target) SELECT follower_id, following_id FROM follow');

        // Migrate existing likes to many-to-many join table (created_at is intentionally dropped in this model).
        $this->addSql('INSERT IGNORE INTO user_tweet (user_id, tweet_id) SELECT user_id, tweet_id FROM `like`');

        $this->addSql('DROP TABLE follow');
        $this->addSql('DROP TABLE `like`');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE follow (id INT AUTO_INCREMENT NOT NULL, follower_id INT NOT NULL, following_id INT NOT NULL, INDEX IDX_68344470AC24F853 (follower_id), INDEX IDX_683444701816E3A3 (following_id), UNIQUE INDEX unique_follow (follower_id, following_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE `like` (id INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, user_id INT NOT NULL, tweet_id INT NOT NULL, INDEX IDX_AC6340B3A76ED395 (user_id), INDEX IDX_AC6340B31041E39B (tweet_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE follow ADD CONSTRAINT FK_68344470AC24F853 FOREIGN KEY (follower_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE follow ADD CONSTRAINT FK_683444701816E3A3 FOREIGN KEY (following_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE `like` ADD CONSTRAINT FK_AC6340B3A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)');
        $this->addSql('ALTER TABLE `like` ADD CONSTRAINT FK_AC6340B31041E39B FOREIGN KEY (tweet_id) REFERENCES tweet (id)');

        $this->addSql('INSERT IGNORE INTO follow (follower_id, following_id) SELECT user_source, user_target FROM user_user');
        $this->addSql('INSERT IGNORE INTO `like` (created_at, user_id, tweet_id) SELECT NOW(), user_id, tweet_id FROM user_tweet');

        $this->addSql('ALTER TABLE user_user DROP FOREIGN KEY FK_F7129A803AD8644E');
        $this->addSql('ALTER TABLE user_user DROP FOREIGN KEY FK_F7129A80233D34C1');
        $this->addSql('ALTER TABLE user_tweet DROP FOREIGN KEY FK_DFA4F163A76ED395');
        $this->addSql('ALTER TABLE user_tweet DROP FOREIGN KEY FK_DFA4F1631041E39B');
        $this->addSql('DROP TABLE user_user');
        $this->addSql('DROP TABLE user_tweet');
    }
}
