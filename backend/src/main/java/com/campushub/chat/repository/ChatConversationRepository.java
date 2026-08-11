package com.campushub.chat.repository;

import com.campushub.chat.model.ChatConversation;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatConversationRepository
        extends JpaRepository<ChatConversation, Long> {

    @EntityGraph(attributePaths = {
            "listing", "listing.college", "order", "buyer", "buyer.college",
            "buyer.trustScore", "seller", "seller.college", "seller.trustScore", "college"
    })
    Optional<ChatConversation> findByBuyerIdAndSellerIdAndListingId(
            Long buyerId,
            Long sellerId,
            Long listingId
    );

    @EntityGraph(attributePaths = {
            "listing", "listing.college", "order", "buyer", "buyer.college",
            "buyer.trustScore", "seller", "seller.college", "seller.trustScore", "college"
    })
    @Query("""
            select conversation
            from ChatConversation conversation
            join ConversationParticipant participant
              on participant.conversation.id = conversation.id
            where participant.user.id = :userId
              and participant.archived = :archived
              and (
                    :search = ''
                    or lower(conversation.listing.title) like lower(concat('%', :search, '%'))
                    or lower(conversation.buyer.fullName) like lower(concat('%', :search, '%'))
                    or lower(conversation.seller.fullName) like lower(concat('%', :search, '%'))
              )
            order by conversation.lastMessageAt desc, conversation.createdAt desc,
                     conversation.id desc
            """)
    Page<ChatConversation> findForUser(
            @Param("userId") Long userId,
            @Param("archived") boolean archived,
            @Param("search") String search,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "listing", "listing.college", "order", "buyer", "buyer.college",
            "buyer.trustScore", "seller", "seller.college", "seller.trustScore", "college"
    })
    @Query("""
            select conversation
            from ChatConversation conversation
            where conversation.id = :conversationId
              and (conversation.buyer.id = :userId or conversation.seller.id = :userId)
            """)
    Optional<ChatConversation> findAccessibleById(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );
}
